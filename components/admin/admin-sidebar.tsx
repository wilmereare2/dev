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
    <aside className="flex h-dvh w-48 shrink-0 flex-col border-r border-border/60 bg-surface/40">
      <div className="border-b border-border/60 px-3 py-3">
        <Link href="/admin" className="font-display text-base font-semibold tracking-tight">
          manuela<span className="text-accent">X</span>
          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">Admin</span>
        </Link>
      </div>
      <nav className="overflow-y-auto p-1.5" aria-label="Admin navigation">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-md px-2.5 py-1.5 text-[13px] transition",
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
      <div className="mt-auto border-t border-border/60 p-2.5">
        <Link href="/" className="text-xs text-muted-foreground hover:text-accent">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
