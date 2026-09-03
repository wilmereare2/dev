import type { Role } from "@/types";

/** Granular admin permissions — enforced server-side. */
export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "users.manage",
  "users.ban",
  "users.roles",
  "users.sessions",
  "creators.view",
  "creators.manage",
  "content.view",
  "content.manage",
  "moderation.view",
  "moderation.action",
  "reports.view",
  "reports.manage",
  "compliance.view",
  "compliance.manage",
  "finance.view",
  "finance.action",
  "ads.view",
  "ads.manage",
  "promotions.view",
  "promotions.manage",
  "comments.moderate",
  "settings.view",
  "settings.manage",
  "audit.view",
  "analytics.view",
  "notifications.view",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const ALL = new Set<AdminPermission>(ADMIN_PERMISSIONS);

const MODERATOR: AdminPermission[] = [
  "dashboard.view",
  "users.view",
  "creators.view",
  "creators.manage",
  "content.view",
  "moderation.view",
  "moderation.action",
  "reports.view",
  "reports.manage",
  "comments.moderate",
  "promotions.view",
  "promotions.manage",
  "analytics.view",
];

const EDITOR: AdminPermission[] = [
  "dashboard.view",
  "content.view",
  "content.manage",
  "moderation.view",
  "moderation.action",
  "comments.moderate",
  "promotions.view",
  "analytics.view",
];

const SUPPORT: AdminPermission[] = [
  "dashboard.view",
  "users.view",
  "reports.view",
  "reports.manage",
  "analytics.view",
];

const FINANCE: AdminPermission[] = [
  "dashboard.view",
  "finance.view",
  "analytics.view",
  "users.view",
];

const COMPLIANCE: AdminPermission[] = [
  "dashboard.view",
  "compliance.view",
  "compliance.manage",
  "users.view",
  "creators.view",
  "audit.view",
  "analytics.view",
];

/** Maps platform roles to admin permission sets. */
export function permissionsForRole(role: Role): Set<AdminPermission> {
  switch (role) {
    case "ADMIN":
      return ALL;
    case "MODERATOR":
      return new Set(MODERATOR);
    case "EDITOR":
      return new Set(EDITOR);
    case "VIEWER":
      return new Set(SUPPORT);
    default:
      return new Set();
  }
}

export function hasAdminPermission(role: Role, permission: AdminPermission) {
  return permissionsForRole(role).has(permission);
}

export function isAdminStaff(role: Role) {
  return permissionsForRole(role).size > 0;
}

export function canAccessAdmin(role: Role) {
  return role === "ADMIN" || role === "MODERATOR" || role === "EDITOR" || role === "VIEWER";
}

/** Nav items gated by permission. */
export type AdminNavItem = {
  href: string;
  label: string;
  permission: AdminPermission;
  icon?: string;
  children?: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", permission: "dashboard.view" },
  { href: "/admin/users", label: "Users", permission: "users.view" },
  { href: "/admin/creators", label: "Creators", permission: "creators.view" },
  { href: "/admin/content", label: "Content", permission: "content.view" },
  { href: "/admin/moderation", label: "Moderation", permission: "moderation.view" },
  { href: "/admin/reports", label: "Reports", permission: "reports.view" },
  { href: "/admin/comments", label: "Comments", permission: "comments.moderate" },
  { href: "/admin/compliance", label: "Compliance", permission: "compliance.view" },
  { href: "/admin/finance", label: "Finance", permission: "finance.view" },
  { href: "/admin/advertisements", label: "Advertisements", permission: "ads.view" },
  { href: "/admin/promotions", label: "Promotions", permission: "promotions.view" },
  { href: "/admin/audit", label: "Audit log", permission: "audit.view" },
  { href: "/admin/settings", label: "Settings", permission: "settings.view" },
];

export function navForRole(role: Role) {
  const allowed = permissionsForRole(role);
  return ADMIN_NAV.filter((item) => allowed.has(item.permission));
}
