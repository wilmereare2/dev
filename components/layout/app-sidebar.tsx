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
  MessageSquare,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { navMessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "manuelax-sidebar-collapsed";

const LINKS = [
  { href: "/", icon: Home },
  { href: "/messages", icon: MessageSquare },
  { href: "/explore", icon: Compass },
  { href: "/categories", icon: LayoutGrid },
  { href: "/promotions", icon: Tag },
  { href: "/trending", icon: TrendingUp },
  { href: "/library", icon: Bookmark },
  { href: "/pricing", icon: Crown },
] as const;

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
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
        "sticky top-[calc(var(--site-header-offset)+1rem)] hidden h-[calc(100vh-var(--site-header-offset)-2rem)] shrink-0 self-start xl:block",
        collapsed ? "w-[72px]" : "w-56",
        className,
      )}
    >
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-surface/40 p-2 backdrop-blur-sm">
        <nav aria-label="App sidebar" className="flex-1 space-y-1">
          {LINKS.map(({ href, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            const key = navMessageKey(href);
            const label = key ? t(key) : href;

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
              {t("sidebar.quickAccess")}
            </div>
            <p className="mt-2 leading-relaxed">{t("sidebar.quickAccessBody")}</p>
          </div>
        ) : null}

        <button
          type="button"
          className="mt-3 flex items-center justify-center rounded-xl border border-border/50 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
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
  if (pathname.startsWith("/account/forgot-password")) return false;
  if (pathname.startsWith("/account/reset-password")) return false;
  if (pathname.startsWith("/studio")) return false;
  return true;
}
