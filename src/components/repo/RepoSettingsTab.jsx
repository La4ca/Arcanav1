import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import RoleBadge from "@/components/shared/RoleBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { showAutoToast } from "@/components/shared/AutoToast";
import { Roles, hasRoleAtLeast, normalizeRole } from "@/utils/rbac";
import { UserPlus, Check, X, ShieldOff, Clock } from "lucide-react";

export default function RepoSettingsTab({ repoId }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const {
    repos, users, repoAccess, repoInvites,
    inviteToRepo, accessRequests, jitGrants,
    resolveTradeSecretAccessRequest, revokeJitGrant, addLog,
  } = useData();

  const repo = repos.find((r) => r.id === repoId);
  const owner = users.find((u) => u.id === repo?.owner);
  const canManage = normalizeRole(currentUser.role) === Roles.Admin || repo?.owner === currentUser.id;
  const canApproveJit =
    normalizeRole(currentUser.role) === Roles.Admin ||
    normalizeRole(currentUser.role) === Roles.Maintainer ||
    repo?.owner === currentUser.id;

  const accessForRepo = repoAccess.filter((a) => a.repoId === repoId);
  const pendingInvitesForRepo = repoInvites.filter((i) => i.repoId === repoId && i.status === "pending");
  const pendingTradeSecretRequests = accessRequests.filter(
    (r) => r.repoId === repoId && r.status === "pending" && !!r.path
  );

  // Active JIT grants for this repo (not yet expired)
  const activeJitGrants = useMemo(() => {
    const now = Date.now();
    return jitGrants
      .filter((g) => {
        if (g.repoId !== repoId) return false;
        const exp = new Date(g.expiresAt).getTime();
        return Number.isFinite(exp) && exp > now;
      })
      .map((g) => ({
        ...g,
        user: users.find((u) => u.id === g.userId),
        expiresDate: new Date(g.expiresAt),
      }));
  }, [jitGrants, repoId, users]);

  const usersWithAccess = useMemo(() => {
    return accessForRepo
      .map((a) => ({ ...a, user: users.find((u) => u.id === a.userId) }))
      .filter((a) => !!a.user);
  }, [accessForRepo, users]);

  const inviteableUsers = useMemo(() => {
    const accessUserIds = new Set(accessForRepo.map((a) => a.userId));
    const pendingInviteeIds = new Set(pendingInvitesForRepo.map((i) => i.inviteeId));
    return users.filter((u) => {
      if (u.id === repo?.owner) return false;
      if (accessUserIds.has(u.id)) return false;
      if (pendingInviteeIds.has(u.id)) return false;
      return true;
    });
  }, [users, accessForRepo, pendingInvitesForRepo, repo?.owner]);

  const [inviteeId, setInviteeId] = useState("");

  const sendInvite = async () => {
    if (!inviteeId) return;
    await inviteToRepo({ inviterId: currentUser.id, inviteeId, repoId, role: Roles.Read });
    const u = users.find((x) => x.id === inviteeId);
    showAutoToast({ type: 'success', title: 'Invitation sent', message: `${u?.username ?? "User"} was invited with View access` });
    setInviteeId("");
  };

  const handleRevoke = async (grant) => {
    try {
      await revokeJitGrant({ actorUserId: currentUser.id, grantId: grant.id });
      showAutoToast({ type: 'success', title: 'Access revoked', message: `JIT access for ${grant.user?.username ?? grant.userId} removed.` });
    } catch (err) {
      showAutoToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const formatExpiry = (date) => {
    const diff = date - Date.now();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
  };

  if (!repo) return null;

  return (
    <div className="space-y-6">
      {/* Pending Trade Secret access requests */}
      {canApproveJit && pendingTradeSecretRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Pending Trade Secret Requests
          </p>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 border-border">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">File</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Reason</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTradeSecretRequests.map((r) => {
                  const u = users.find((x) => x.id === r.userId);
                  return (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="font-mono text-sm text-foreground">{u?.username ?? r.userId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.path}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.reason || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm" variant="outline"
                            className="font-mono text-xs"
                            onClick={() => {
                              resolveTradeSecretAccessRequest({ actorUserId: currentUser.id, requestId: r.id, approve: true });
                              showAutoToast({ type: "success", title: "Access Approved", message: "JIT access granted for 24 hours." });
                            }}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              resolveTradeSecretAccessRequest({ actorUserId: currentUser.id, requestId: r.id, approve: false });
                              toast({ title: "Denied", description: "Request was denied" });
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Deny
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Fix #4: Active JIT grants with Force Revoke */}
      {canApproveJit && activeJitGrants.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Active JIT Access Grants
          </p>
          <div className="bg-card rounded-lg border border-amber-500/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-500/5 border-amber-500/20">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">File</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Expires</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeJitGrants.map((g) => (
                  <TableRow key={g.id} className="border-amber-500/10">
                    <TableCell className="font-mono text-sm text-foreground">{g.user?.username ?? g.userId}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{g.path}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="font-mono text-xs text-amber-300">{formatExpiry(g.expiresDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm" variant="destructive"
                        className="font-mono text-xs h-7"
                        onClick={() => handleRevoke(g)}
                      >
                        <ShieldOff className="w-3.5 h-3.5 mr-1" /> Force Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invite collaborator */}
      {canManage && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Invite Collaborator</p>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
            <Select value={inviteeId} onValueChange={setInviteeId}>
              <SelectTrigger className="w-64 font-mono text-xs bg-secondary border-border h-8">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {inviteableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="font-mono text-xs">
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm" onClick={sendInvite}
              className="font-mono text-xs bg-primary text-primary-foreground"
              disabled={!inviteeId}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Invite
            </Button>
          </div>

          {pendingInvitesForRepo.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 border-border">
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pending Invites</TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitesForRepo.map((inv) => {
                    const u = users.find((x) => x.id === inv.inviteeId);
                    return (
                      <TableRow key={inv.id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">{u?.username ?? inv.inviteeId}</TableCell>
                        <TableCell><RoleBadge role={inv.role} /></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">pending</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Users with access */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Users with Access</p>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 border-border">
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owner && (
                <TableRow className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                        {owner.avatar}
                      </div>
                      <span className="font-mono text-sm text-foreground">{owner.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">owner</TableCell>
                </TableRow>
              )}
              {usersWithAccess.map(({ userId, role, user }) => (
                <TableRow key={userId} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                        {user.avatar}
                      </div>
                      <span className="font-mono text-sm text-foreground">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell><RoleBadge role={role} /></TableCell>
                </TableRow>
              ))}
              {!owner && usersWithAccess.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center font-mono text-xs text-muted-foreground py-6">
                    No users yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
