"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  History,
  Home,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "manuelax-sidebar-collapsed";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/pricing", label: "Pricing", icon: Crown },
] as const;

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-20 hidden h-[calc(100vh-6rem)] shrink-0 self-start xl:block",
        collapsed ? "w-[72px]" : "w-56",
        className,
      )}
    >
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-surface/40 p-2 backdrop-blur-sm">
        <nav aria-label="App sidebar" className="flex-1 space-y-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center px-2" : "",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {!collapsed ? <span>{label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed ? (
          <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <History className="size-3.5 text-accent" aria-hidden />
              Quick access
            </div>
            <p className="mt-2 leading-relaxed">
              Library saves favorites, watch later, and history in one place.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          className="mt-3 flex items-center justify-center rounded-xl border border-border/50 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleCollapsed}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
    </aside>
  );
}

export function shouldShowAppSidebar(pathname: string) {
  if (pathname === "/verify-age") return false;
  if (pathname.startsWith("/account")) return false;
  if (pathname.startsWith("/studio")) return false;
  return true;
}
