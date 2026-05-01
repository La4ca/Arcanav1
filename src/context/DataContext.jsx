import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COL, genId, nowTs } from "@/lib/firestore";
import { addDoc as _addDoc, collection as _col } from "firebase/firestore";
import { Roles, canUserAccessFile, hasRoleAtLeast, normalizeRole } from "@/utils/rbac";

const DataContext = createContext(null);

// helpers
function snapToArray(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function DataProvider({ children }) {
  const [users,          setUsers]          = useState([]);
  const [repos,          setRepos]          = useState([]);
  const [repoAccess,     setRepoAccess]     = useState([]);
  const [repoInvites,    setRepoInvites]    = useState([]);
  const [files,          setFilesRaw]       = useState([]);   // flat array
  const [accessRequests, setAccessRequests] = useState([]);
  const [jitGrants,      setJitGrants]      = useState([]);
  const [commits,        setCommitsRaw]     = useState([]);   // flat array
  const [logs,           setLogs]           = useState([]);
  const [loading,        setLoading]        = useState(true);

  // Real-time listeners 
  useEffect(() => {
    const unsubs = [];

    unsubs.push(onSnapshot(collection(db, COL.USERS),           (s) => setUsers(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.REPOS),           (s) => setRepos(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.REPO_ACCESS),     (s) => setRepoAccess(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.REPO_INVITES),    (s) => setRepoInvites(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.FILES),           (s) => setFilesRaw(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.ACCESS_REQUESTS), (s) => setAccessRequests(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.JIT_GRANTS),      (s) => setJitGrants(snapToArray(s))));
    unsubs.push(onSnapshot(collection(db, COL.COMMITS),         (s) => setCommitsRaw(snapToArray(s))));
    unsubs.push(
      onSnapshot(
        query(collection(db, COL.LOGS), orderBy("timestamp", "desc")),
        (s) => setLogs(snapToArray(s))
      )
    );

    // Mark loading done after first batch
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(timer);
    };
  }, []);

  // files as { [repoId]: [...] }
  const filesMap = files.reduce((acc, f) => {
    if (!acc[f.repoId]) acc[f.repoId] = [];
    acc[f.repoId].push(f);
    return acc;
  }, {});

  // commits as { [repoId]: [...] } sorted newest-first
  const commitsMap = commits.reduce((acc, c) => {
    if (!acc[c.repoId]) acc[c.repoId] = [];
    acc[c.repoId].push(c);
    return acc;
  }, {});

  // RBAC helpers 
  const getRepoRole = useCallback((userId, repoId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    if (normalizeRole(u.role) === Roles.Admin) return Roles.Admin;
    const repo = repos.find((r) => r.id === repoId);
    if (repo && repo.owner === userId) return Roles.Maintainer;
    const access = repoAccess.find((a) => a.userId === userId && a.repoId === repoId);
    return access?.role ? normalizeRole(access.role) : null;
  }, [users, repos, repoAccess]);

  const hasActiveJitGrant = useCallback(({ userId, repoId, path }) => {
    const now = Date.now();
    return jitGrants.some((g) => {
      if (g.userId !== userId || g.repoId !== repoId || g.path !== path) return false;
      const exp = new Date(g.expiresAt).getTime();
      return Number.isFinite(exp) && exp > now;
    });
  }, [jitGrants]);

  const canUserAccessFileJit = useCallback(({ userId, repoId, file }) => {
    if (!file) return false;
    const u = users.find((x) => x.id === userId);
    const repoRole = getRepoRole(userId, repoId);
    const base = canUserAccessFile({ userRole: u?.role, repoRole, file });
    if (base) return true;
    if (!file.restricted) return false;
    return hasActiveJitGrant({ userId, repoId, path: file.path });
  }, [users, getRepoRole, hasActiveJitGrant]);

  // Write helpers 
  const addLog = useCallback(async (logEntry) => {
    await addDoc(collection(db, COL.LOGS), {
      ...logEntry,
      meta: logEntry.meta || {},
      timestamp: logEntry.timestamp || nowTs(),
    });
  }, []);

  const updateUserRole = useCallback(async (userId, newRole) => {
    await updateDoc(doc(db, COL.USERS, userId), { role: newRole });
  }, []);

  const addUser = useCallback(async ({ username, email, role, avatar }) => {
    const newId = genId("u");
    const newUser = {
      username,
      email,
      role,
      avatar: avatar || username[0].toUpperCase(),
    };
    await setDoc(doc(db, COL.USERS, newId), newUser);
    return { id: newId, ...newUser };
  }, []);

  const removeUser = useCallback(async (userId) => {
    await deleteDoc(doc(db, COL.USERS, userId));
    // clean up access and invites
    const accessSnap = await getDocs(query(collection(db, COL.REPO_ACCESS), where("userId", "==", userId)));
    for (const d of accessSnap.docs) await deleteDoc(d.ref);
    const invSnap = await getDocs(query(collection(db, COL.REPO_INVITES), where("inviteeId", "==", userId)));
    for (const d of invSnap.docs) await deleteDoc(d.ref);
  }, []);

  const grantAccess = useCallback(async (userId, repoId, role) => {
    const existing = repoAccess.find((a) => a.userId === userId && a.repoId === repoId);
    if (existing) {
      await updateDoc(doc(db, COL.REPO_ACCESS, existing.id), { role });
    } else {
      await addDoc(collection(db, COL.REPO_ACCESS), { userId, repoId, role });
    }
  }, [repoAccess]);

  const revokeAccess = useCallback(async (userId, repoId) => {
    const existing = repoAccess.find((a) => a.userId === userId && a.repoId === repoId);
    if (existing) await deleteDoc(doc(db, COL.REPO_ACCESS, existing.id));
  }, [repoAccess]);

  const inviteToRepo = useCallback(async ({ inviterId, inviteeId, repoId, role = Roles.Read }) => {
    const normalizedRole = normalizeRole(role || Roles.Read);
    const existing = repoInvites.find(
      (i) => i.repoId === repoId && i.inviteeId === inviteeId && i.status === "pending"
    );
    if (existing) return;
    await addDoc(collection(db, COL.REPO_INVITES), {
      repoId, inviterId, inviteeId,
      role: normalizedRole,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    // Notify the invitee
    const inviter = users.find(u => u.id === inviterId);
    const repo = repos.find(r => r.id === repoId);
    await addDoc(collection(db, "notifications"), {
      recipientId: inviteeId,
      type: "repo_invite",
      title: "Repository Invitation",
      message: `${inviter?.username ?? "Someone"} invited you to ${repo?.name ?? repoId} (${normalizedRole})`,
      repoId,
      read: false,
      createdAt: new Date().toISOString(),
    });
    // Log the action
    await addLog({
      user: inviter?.username ?? inviterId,
      action: "REPO_INVITE",
      repo: repoId,
      resource: repo?.name ?? repoId,
      ip: "127.0.0.1",
      meta: { inviteeId, role: normalizedRole },
    });
  }, [repoInvites, users, repos, addLog]);

  const acceptInvite = useCallback(async ({ inviteId, actorUserId }) => {
    const inv = repoInvites.find((i) => i.id === inviteId);
    if (!inv || inv.inviteeId !== actorUserId || inv.status !== "pending") return null;
    await updateDoc(doc(db, COL.REPO_INVITES, inviteId), {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    });
    await grantAccess(inv.inviteeId, inv.repoId, normalizeRole(inv.role || Roles.Read));
    return inv;
  }, [repoInvites, grantAccess]);

  const declineInvite = useCallback(async ({ inviteId, actorUserId }) => {
    const inv = repoInvites.find((i) => i.id === inviteId);
    if (!inv || inv.inviteeId !== actorUserId || inv.status !== "pending") return;
    await updateDoc(doc(db, COL.REPO_INVITES, inviteId), {
      status: "declined",
      declinedAt: new Date().toISOString(),
    });
  }, [repoInvites]);

  const addRepo = useCallback(async (repo) => {
    const { id: _id, ...repoData } = repo;
    await addDoc(collection(db, COL.REPOS), repoData);
  }, []);

  const toggleSensitivity = useCallback(async (repoId) => {
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return;
    await updateDoc(doc(db, COL.REPOS, repoId), { is_sensitive: !repo.is_sensitive });
  }, [repos]);

  const deleteRepo = useCallback(async (repoId) => {
    await deleteDoc(doc(db, COL.REPOS, repoId));
    const accessSnap = await getDocs(query(collection(db, COL.REPO_ACCESS), where("repoId", "==", repoId)));
    for (const d of accessSnap.docs) await deleteDoc(d.ref);
  }, []);

  const addCommit = useCallback(async (repoId, commit) => {
    await addDoc(collection(db, COL.COMMITS), { ...commit, repoId });
    const repo = repos.find((r) => r.id === repoId);
    if (repo) {
      await updateDoc(doc(db, COL.REPOS, repoId), {
        commits: (repo.commits || 0) + 1,
        lastActivity: "Just now",
      });
    }
  }, [repos]);

  const requestTradeSecretAccess = useCallback(async ({ userId, repoId, path, reason }) => {
    const existing = accessRequests.find(
      (r) => r.userId === userId && r.repoId === repoId && r.path === path && r.status === "pending"
    );
    if (existing) return existing;

    const req = {
      userId, repoId, path,
      requestedRole: Roles.Read,
      reason: reason || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, COL.ACCESS_REQUESTS), req);

    const u = users.find((x) => x.id === userId);
    await addLog({
      user: u?.username ?? "unknown",
      action: "REQUEST_ACCESS",
      repo: repoId,
      resource: "trade_secret",
      ip: "127.0.0.1",
      meta: { path },
    });

    // Notify all Admins and Maintainers
    const { Roles: R, normalizeRole: nr, hasRoleAtLeast: hrl } = await import("@/utils/rbac");
    const notifyUsers = users.filter(u => hrl(nr(u.role), R.Maintainer));
    await Promise.all(notifyUsers.map(admin =>
      _addDoc(_col(db, "notifications"), {
        recipientId: admin.id,
        type: "access_request",
        title: "New Access Request",
        message: `${u?.username ?? "A user"} requested access to ${path}`,
        repoId,
        path,
        read: false,
        createdAt: new Date().toISOString(),
      })
    ));

    return { id: ref.id, ...req };
  }, [accessRequests, users, addLog]);

  const resolveTradeSecretAccessRequest = useCallback(async ({ actorUserId, requestId, approve }) => {
    const actor = users.find((x) => x.id === actorUserId);
    if (!actor || !hasRoleAtLeast(normalizeRole(actor.role), Roles.Maintainer)) {
      throw new Error("Lead Dev (Maintainer+) required.");
    }

    const req = accessRequests.find((r) => r.id === requestId);
    if (!req) throw new Error("Request not found.");
    if (req.status !== "pending") return req;

    const resolvedAt = new Date().toISOString();
    await updateDoc(doc(db, COL.ACCESS_REQUESTS, requestId), {
      status: approve ? "approved" : "denied",
      resolvedAt,
      resolvedBy: actorUserId,
    });

    if (approve) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await addDoc(collection(db, COL.JIT_GRANTS), {
        userId: req.userId, repoId: req.repoId, path: req.path,
        expiresAt, grantedBy: actorUserId, grantedAt: resolvedAt,
      });
    }

    await addLog({
      user: actor.username,
      action: approve ? "APPROVE_ACCESS" : "DENY_ACCESS",
      repo: req.repoId,
      resource: "trade_secret",
      ip: "127.0.0.1",
      meta: { requestId, path: req.path },
    });

    // Notify the requester of the outcome
    await addDoc(collection(db, "notifications"), {
      recipientId: req.userId,
      type: approve ? "access_approved" : "access_denied",
      title: approve ? "Access Approved" : "Access Denied",
      message: approve
        ? `Your request to access ${req.path} was approved (24h JIT).`
        : `Your request to access ${req.path} was denied.`,
      repoId: req.repoId,
      path: req.path,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { ...req, status: approve ? "approved" : "denied", resolvedAt, resolvedBy: actorUserId };
  }, [users, accessRequests, addLog]);

  const addFile = useCallback(async (repoId, { path, content: fileContent, restricted }) => {
    await addDoc(collection(db, COL.FILES), {
      repoId,
      path: path.trim(),
      content: fileContent || '',
      restricted: !!restricted,
      allowedRoles: restricted ? ['Admin', 'Maintainer'] : [],
    });
  }, []);

  const deleteFile = useCallback(async (fileId) => {
    await deleteDoc(doc(db, COL.FILES, fileId));
  }, []);

    const revokeJitGrant = useCallback(async ({ actorUserId, grantId }) => {
    const actor = users.find((x) => x.id === actorUserId);
    if (!actor || !hasRoleAtLeast(normalizeRole(actor.role), Roles.Maintainer)) {
      throw new Error("Lead Dev (Maintainer+) required to revoke access.");
    }
    const grant = jitGrants.find((g) => g.id === grantId);
    if (!grant) throw new Error("Grant not found.");
    await deleteDoc(doc(db, COL.JIT_GRANTS, grantId));
    await addLog({
      user: actor.username,
      action: "REVOKE_JIT_ACCESS",
      repo: grant.repoId,
      resource: "trade_secret",
      ip: "127.0.0.1",
      meta: { path: grant.path, revokedUserId: grant.userId },
    });
    // Notify the user whose access was revoked
    await addDoc(collection(db, "notifications"), {
      recipientId: grant.userId,
      type: "access_revoked",
      title: "JIT Access Revoked",
      message: `Your access to ${grant.path} was revoked by ${actor.username}.`,
      repoId: grant.repoId,
      path: grant.path,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }, [users, jitGrants, addLog]);

    return (
    <DataContext.Provider
      value={{
        // state
        users,
        repos,
        repoAccess,
        repoInvites,
        files: filesMap,       // { [repoId]: [...] } — same shape as old mock
        accessRequests,
        jitGrants,
        commits: commitsMap,   // { [repoId]: [...] } — same shape as old mock
        logs,
        loading,
        // helpers
        getRepoRole,
        canUserAccessFileJit,
        // writes
        updateUserRole,
        addUser,
        removeUser,
        grantAccess,
        revokeAccess,
        inviteToRepo,
        acceptInvite,
        declineInvite,
        addRepo,
        toggleSensitivity,
        deleteRepo,
        addCommit,
        addLog,
        requestTradeSecretAccess,
        resolveTradeSecretAccessRequest,
        revokeJitGrant,
        addFile,
        deleteFile,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

// ── Backward-compat aliases so NO component file needs to change 
export { useData as useMockData };
export { DataProvider as MockDataProvider };
