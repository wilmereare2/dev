"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/lib/admin/permissions";

type AdminSidebarProps = {
  items: AdminNavItem[];
};

export function AdminSidebar({ items }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border/60 bg-surface/40">
      <div className="border-b border-border/60 px-4 py-4">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-tight">
          manuela<span className="text-accent">X</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin navigation">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-accent/15 font-medium text-accent"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border/60 p-3">
        <Link href="/" className="text-xs text-muted-foreground hover:text-accent">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
