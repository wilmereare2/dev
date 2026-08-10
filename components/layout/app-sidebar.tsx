"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { QUICK_SIDEBAR_LINKS, QUICK_SIDEBAR_SECONDARY } from "@/lib/site/quick-sidebar-nav";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "manuelax-sidebar-collapsed";
const WIDTH_EXPANDED = "14rem";
const WIDTH_COLLAPSED = "4.5rem";

function readCollapsedPreference() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function applySidebarWidth(collapsed: boolean) {
  document.documentElement.style.setProperty(
    "--site-sidebar-width",
    collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
  );
}

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readCollapsedPreference();
    setCollapsed(initial);
    applySidebarWidth(initial);
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      writeCollapsedPreference(next);
      applySidebarWidth(next);
      return next;
    });
  }, []);

  function renderLink(href: string, Icon: (typeof QUICK_SIDEBAR_LINKS)[number]["icon"], labelKey: MessageKey) {
    const active =
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    const label = t(labelKey);

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
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </Link>
    );
  }

  return (
    <aside
      style={{ width: mounted ? (collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED) : WIDTH_EXPANDED }}
      className={cn(
        "sticky top-[calc(var(--site-header-offset)+1rem)] hidden h-[calc(100dvh-var(--site-header-offset)-var(--site-bottom-offset)-2rem)] shrink-0 self-start transition-[width] duration-200 ease-out lg:block",
        className,
      )}
    >
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-surface/40 p-2 backdrop-blur-sm">
        {!collapsed ? (
          <p className="px-3 pb-2 pt-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quick access
          </p>
        ) : null}

        <nav aria-label="Quick access" className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {QUICK_SIDEBAR_LINKS.map(({ href, icon, labelKey }) => renderLink(href, icon, labelKey))}

          {!collapsed ? (
            <p className="px-3 pb-1 pt-4 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Discover
            </p>
          ) : null}
          {QUICK_SIDEBAR_SECONDARY.map(({ href, icon, labelKey }) => renderLink(href, icon, labelKey))}
        </nav>

        {!collapsed ? (
          <div className="mt-4 shrink-0 rounded-xl border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <History className="size-3.5 text-accent" aria-hidden />
              {t("sidebar.quickAccess")}
            </div>
            <p className="mt-2 leading-relaxed">{t("sidebar.quickAccessBody")}</p>
          </div>
        ) : null}

        <button
          type="button"
          className={cn(
            "mt-3 flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border/50 py-2.5 text-sm text-muted-foreground transition hover:border-accent/30 hover:bg-muted hover:text-foreground",
            collapsed ? "px-2" : "px-3",
          )}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          aria-expanded={!collapsed}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          onClick={toggleCollapsed}
        >
          {collapsed ? <ChevronRight className="size-4" aria-hidden /> : <ChevronLeft className="size-4" aria-hidden />}
          {!collapsed ? <span>{t("sidebar.collapse")}</span> : null}
        </button>
      </div>
    </aside>
  );
}

export function shouldShowAppSidebar(pathname: string) {
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return false;
  if (pathname.startsWith("/creator/")) return false;
  if (pathname === "/verify-age") return false;
  if (pathname.startsWith("/account/forgot-password")) return false;
  if (pathname.startsWith("/account/reset-password")) return false;
  if (pathname.startsWith("/studio")) return false;
  return true;
}
