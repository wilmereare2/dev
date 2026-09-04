"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NavActions } from "@/components/layout/nav-actions";
import { MobileUserLinks, UserMenu } from "@/components/layout/user-menu";
import {
  SearchCommandPalette,
  useSearchCommandPalette,
} from "@/components/search/search-command-palette";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { navMessageKey } from "@/lib/i18n";
import type { NavItem } from "@/types";

type NavbarProps = {
  navItems: NavItem[];
};

export function Navbar({ navItems }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen } = useSearchCommandPalette();
  const pathname = usePathname();
  const { t } = useI18n();

  function navLabel(item: NavItem) {
    const key = navMessageKey(item.href);
    return key ? t(key) : item.label;
  }

  const linkClass = (href: string, active: boolean, mobile = false) =>
    cn(
      mobile ? "block rounded-lg px-3 py-2.5 text-sm transition" : "rounded-lg px-3 py-2 text-sm transition",
      active
        ? "bg-accent/10 font-medium text-accent"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 overflow-visible border-b border-border/60 bg-background shadow-sm supports-[backdrop-filter]:bg-background/95 supports-[backdrop-filter]:backdrop-blur-xl">
        {/*
          The header keeps one width on every route. It used to inherit the
          page's layout mode, so the logo jumped ~190px sideways between a
          gallery route (full width) and a constrained one, and the last nav
          item was clipped on the narrower variant.
        */}
        <div className="mx-auto flex h-16 w-full max-w-none items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6 lg:gap-8">
            <Link
              href="/"
              className="shrink-0 font-display text-lg font-bold tracking-tight sm:text-xl lg:text-2xl"
              onClick={() => setOpen(false)}
            >
              manuela<span className="text-accent">X</span>
            </Link>

            <nav
              className={cn(
                "hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                // The scrollbar is hidden, so a clipped item would otherwise
                // look broken rather than scrollable. The fade sits over the
                // trailing edge and is only visible once items reach it.
                "[mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]",
              )}
              aria-label="Primary"
            >
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn(linkClass(item.href, active), "shrink-0 whitespace-nowrap")}>
                    {navLabel(item)}
                    {item.comingSoon ? (
                      <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("common.soon")}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 overflow-visible sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("common.openSearch")}
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-4" />
            </Button>
            <NavActions />
            <ThemeToggle />
            <UserMenu />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border/50 md:hidden"
              aria-label="Mobile"
            >
              <div className="space-y-1 px-4 py-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setOpen(false);
                    setPaletteOpen(true);
                  }}
                >
                  <Search className="size-4" />
                  {t("common.searchCatalog")}
                </button>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={linkClass(item.href, isActive(item.href), true)}
                  >
                    {navLabel(item)}
                    {item.comingSoon ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-muted-foreground">
                        {t("common.soon")}
                      </span>
                    ) : null}
                  </Link>
                ))}
                <MobileUserLinks onNavigate={() => setOpen(false)} />
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>

      <SearchCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
