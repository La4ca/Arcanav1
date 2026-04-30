// ─── Firestore seed & helper utilities ────────────────────────────────────
// Run seedDatabase() once from the browser console (as Admin) to populate
// Firestore with the initial data. After seeding, the real-time listeners
// in DataContext take over and the seed is never needed again.

import {
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Roles } from "@/utils/rbac";

// ── Collection names ────────────────────────────────────────────────────────
export const COL = {
  USERS:           "users",
  REPOS:           "repos",
  REPO_ACCESS:     "repoAccess",
  REPO_INVITES:    "repoInvites",
  FILES:           "files",
  COMMITS:         "commits",
  LOGS:            "logs",
  ACCESS_REQUESTS: "accessRequests",
  JIT_GRANTS:      "jitGrants",
};

// ── Seed data (mirrors the old mock/index.js) ───────────────────────────────
const SEED_USERS = [
  { id: "u1", username: "owner",    email: "owner@arcana.local",      password: "arcana123", role: Roles.Admin,      avatar: "O" },
  { id: "u2", username: "dev",      email: "dev@arcana.local",        password: "arcana123", role: Roles.Write,      avatar: "D" },
  { id: "u3", username: "viewer",   email: "viewer@arcana.local",     password: "arcana123", role: Roles.Read,       avatar: "V" },
  { id: "u4", username: "auditor",  email: "auditor@arcana.local",    password: "arcana123", role: Roles.Triage,     avatar: "A" },
  { id: "u5", username: "lead dev", email: "maintainer@arcana.local", password: "arcana123", role: Roles.Maintainer, avatar: "M" },
];

const SEED_REPOS = [
  {
    id: "r1",
    name: "arcana-core",
    description: "Core application logic and UI components.",
    owner: "u2",
    is_sensitive: false,
    commits: 1,
    lastActivity: "2h ago",
  },
  {
    id: "r2",
    name: "ops-secrets",
    description: "Restricted operational notes and runbooks.",
    owner: "u1",
    is_sensitive: true,
    commits: 1,
    lastActivity: "1d ago",
  },
];

const SEED_REPO_ACCESS = [
  { id: "ra1", userId: "u3", repoId: "r1", role: Roles.Read },
  { id: "ra2", userId: "u4", repoId: "r2", role: Roles.Triage },
  { id: "ra3", userId: "u5", repoId: "r1", role: Roles.Maintainer },
];

const SEED_FILES = [
  { id: "f1", repoId: "r1", path: "src/App.jsx",       restricted: false, allowedRoles: [], content: `export default function App() {\n  return <div>Arcana</div>;\n}\n` },
  { id: "f2", repoId: "r1", path: "README.md",          restricted: false, allowedRoles: [], content: `# arcana-core\n\nDemo data for the repository viewer.\n` },
  { id: "f3", repoId: "r1", path: "TRADE_SECRETS.md",   restricted: true,  allowedRoles: [Roles.Admin, Roles.Maintainer], content: `# Trade secrets\n\nThis file is restricted to Admin/Maintainer.\n` },
  { id: "f4", repoId: "r2", path: "RUNBOOK.md",         restricted: true,  allowedRoles: [Roles.Admin, Roles.Maintainer], content: `# ops-secrets\n\nThis is sensitive operational content.\n` },
  { id: "f5", repoId: "r2", path: "notes/incident.md",  restricted: true,  allowedRoles: [Roles.Admin, Roles.Triage, Roles.Maintainer], content: `# Incident Notes\n\n- Timeline\n- Actions\n` },
];

const SEED_COMMITS = [
  { id: "c1", repoId: "r1", commitId: "a1b2c3", message: "Initialize repository structure", author: "dev",  timestamp: "2026-04-23 19:10", files: ["src/App.jsx", "src/main.jsx"] },
  { id: "c2", repoId: "r2", commitId: "d4e5f6", message: "Add incident response draft",    author: "owner", timestamp: "2026-04-22 09:30", files: ["RUNBOOK.md"] },
];

const SEED_LOGS = [
  {
    id: "l1",
    user: "viewer",
    action: "ACCESS_DENIED",
    repo: "r2",
    resource: "repo",
    ip: "192.168.1.24",
    timestamp: "2026-04-23 18:44",
    meta: { reason: "trade_secret" },
  },
];

// ── seedDatabase ────────────────────────────────────────────────────────────
// Call once. Checks if data already exists before writing.
export async function seedDatabase() {
  try {
    const snap = await getDoc(doc(db, COL.USERS, "u1"));
    if (snap.exists()) {
      console.log("[Arcana] Firestore already seeded — skipping.");
      return;
    }

    console.log("[Arcana] Seeding Firestore…");

    for (const u of SEED_USERS) {
      const { password, ...firestoreUser } = u;
      await setDoc(doc(db, COL.USERS, u.id), firestoreUser);
    }

    for (const r of SEED_REPOS) {
      await setDoc(doc(db, COL.REPOS, r.id), r);
    }

    for (const a of SEED_REPO_ACCESS) {
      await setDoc(doc(db, COL.REPO_ACCESS, a.id), a);
    }

    for (const f of SEED_FILES) {
      await setDoc(doc(db, COL.FILES, f.id), f);
    }

    for (const c of SEED_COMMITS) {
      await setDoc(doc(db, COL.COMMITS, c.id), c);
    }

    for (const l of SEED_LOGS) {
      await setDoc(doc(db, COL.LOGS, l.id), l);
    }

    console.log("[Arcana] Seed complete ✓");
  } catch (err) {
    console.error("[Arcana] Seed failed:", err);
    throw err;
  }
}

// ── getSeedUsers ─────────────────────────────────────────────────────────────
// Expose seed user list so AuthContext can use them for quick-login emails.
export function getSeedUsers() {
  return SEED_USERS;
}

// ── nowTs ────────────────────────────────────────────────────────────────────
export function nowTs() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── genId ────────────────────────────────────────────────────────────────────
export function genId(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

export {
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
};

// ── sendNotification ─────────────────────────────────────────────────────────
// Call this to create a notification for a specific user.
export async function sendNotification(db, { recipientId, type, title, message, repoId, path }) {
  const { addDoc, collection } = await import('firebase/firestore');
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type,   // 'access_request' | 'repo_created' | 'file_added' | 'commit'
    title,
    message,
    repoId: repoId || null,
    path: path || null,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
