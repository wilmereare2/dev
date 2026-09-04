"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/lib/admin/permissions";

type AdminSidebarProps = {
  items: AdminNavItem[];
};

function NavList({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                // Comfortable touch target on phones, compact on desktop.
                "block rounded-md px-3 py-2.5 text-sm transition lg:px-2.5 lg:py-1.5 lg:text-[13px]",
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
  );
}

function SidebarBody({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-3">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="font-display text-base font-semibold tracking-tight"
        >
          manuela<span className="text-accent">X</span>
          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">Admin</span>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-1.5" aria-label="Admin navigation">
        <NavList items={items} onNavigate={onNavigate} />
      </nav>
      <div className="mt-auto border-t border-border/60 p-2.5">
        <Link href="/" onClick={onNavigate} className="text-xs text-muted-foreground hover:text-accent">
          ← Back to site
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar({ items }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever navigation lands on a new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Persistent rail — desktop only. */}
      <aside className="hidden h-dvh w-48 shrink-0 flex-col border-r border-border/60 bg-surface/40 lg:sticky lg:top-0 lg:flex">
        <SidebarBody items={items} />
      </aside>

      {/* Mobile trigger, sitting in the admin header row. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin navigation"
        aria-expanded={open}
        className="fixed left-3 top-2.5 z-50 inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background/95 text-foreground shadow-sm backdrop-blur lg:hidden"
      >
        <Menu className="size-4" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-border/60 bg-background shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin navigation"
              className="absolute right-2 top-2.5 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarBody items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
