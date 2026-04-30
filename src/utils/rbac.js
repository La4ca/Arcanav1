export const Roles = Object.freeze({
  Admin: "Admin",
  Maintainer: "Maintainer",
  Write: "Write",
  Triage: "Triage",
  Read: "Read",
});

const roleRank = Object.freeze({
  [Roles.Read]: 1,
  [Roles.Triage]: 2,
  [Roles.Write]: 3,
  [Roles.Maintainer]: 4,
  [Roles.Admin]: 5,
});

export function normalizeRole(role) {
  if (!role) return Roles.Read;
  if (Object.values(Roles).includes(role)) return role;

  const r = String(role).toLowerCase();
  if (r === "admin") return Roles.Admin;
  if (r === "maintainer") return Roles.Maintainer;
  if (r === "developer") return Roles.Write;
  if (r === "auditor") return Roles.Triage;
  if (r === "viewer") return Roles.Read;
  if (r === "user") return Roles.Read;
  return Roles.Read;
}

export function hasRoleAtLeast(userRole, minimumRole) {
  const a = roleRank[normalizeRole(userRole)] ?? 0;
  const b = roleRank[normalizeRole(minimumRole)] ?? 0;
  return a >= b;
}

export function canAccessRestrictedFile(userRole, allowedRoles = []) {
  const normalized = normalizeRole(userRole);
  const allowed = (allowedRoles || []).map(normalizeRole);
  return allowed.includes(normalized) || normalized === Roles.Admin;
}

/**
 * File permission check used by the mock backend.
 * - `restricted`: trade secret file requiring explicit allow list
 * - `allowedRoles`: allow-list for restricted files (Admin always allowed)
 */
export function canUserAccessFile({ userRole, repoRole, file }) {
  const effectiveRole = normalizeRole(repoRole || userRole);
  const normalizedUserRole = normalizeRole(userRole);

  if (!file) return false;

  // Basic repo-level: must be at least Read
  if (!hasRoleAtLeast(effectiveRole, Roles.Read)) return false;

  if (file.restricted) {
    return canAccessRestrictedFile(normalizedUserRole, file.allowedRoles);
  }

  // Non-restricted: allow if repo role >= Read
  return true;
}

