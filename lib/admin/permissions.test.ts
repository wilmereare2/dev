import { describe, expect, it } from "vitest";
import { hasAdminPermission, isAdminStaff, navForRole, permissionsForRole } from "@/lib/admin/permissions";

describe("admin permissions", () => {
  it("grants full access to ADMIN", () => {
    expect(hasAdminPermission("ADMIN", "audit.view")).toBe(true);
    expect(hasAdminPermission("ADMIN", "finance.action")).toBe(true);
  });

  it("restricts MODERATOR from finance and audit", () => {
    expect(hasAdminPermission("MODERATOR", "moderation.action")).toBe(true);
    expect(hasAdminPermission("MODERATOR", "finance.view")).toBe(false);
    expect(hasAdminPermission("MODERATOR", "audit.view")).toBe(false);
  });

  it("allows EDITOR content workflows only", () => {
    expect(hasAdminPermission("EDITOR", "content.manage")).toBe(true);
    expect(hasAdminPermission("EDITOR", "users.manage")).toBe(false);
  });

  it("allows VIEWER support-style read access", () => {
    expect(hasAdminPermission("VIEWER", "reports.view")).toBe(true);
    expect(hasAdminPermission("VIEWER", "settings.manage")).toBe(false);
  });

  it("denies regular users admin access", () => {
    expect(isAdminStaff("USER")).toBe(false);
    expect(permissionsForRole("USER").size).toBe(0);
  });

  it("filters navigation by role", () => {
    const modNav = navForRole("MODERATOR");
    expect(modNav.some((item) => item.href === "/admin/moderation")).toBe(true);
    expect(modNav.some((item) => item.href === "/admin/finance")).toBe(false);

    const editorNav = navForRole("EDITOR");
    expect(editorNav.some((item) => item.href === "/admin/content")).toBe(true);
    expect(editorNav.some((item) => item.href === "/admin/users")).toBe(false);
  });
});
