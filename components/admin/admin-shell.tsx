import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { navForRole } from "@/lib/admin/permissions";
import { requireRole } from "@/lib/auth/guards";
import type { Role } from "@/types";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["ADMIN", "MODERATOR", "EDITOR", "VIEWER"]);
  const role = (session.user.role ?? "USER") as Role;
  const navItems = navForRole(role);

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 sm:px-6">
          <p className="truncate text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{session.user.name ?? session.user.email}</span>
            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{role}</span>
          </p>
          <Link href="/admin" className="text-sm text-accent hover:underline">
            Dashboard
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
