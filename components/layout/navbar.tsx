"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

type NavbarProps = {
  navItems: NavItem[];
};

export function Navbar({ navItems }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight sm:text-2xl"
            onClick={() => setOpen(false)}
          >
            manuela<span className="text-accent">X</span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={linkClass(item.href, active)}>
                  {item.label}
                  {item.comingSoon ? (
                    <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link href="/search">
              <Search className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/account">
              <User className="size-4" />
              Account
            </Link>
          </Button>
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={linkClass(item.href, isActive(item.href), true)}
                >
                  {item.label}
                  {item.comingSoon ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase text-muted-foreground">
                      Soon
                    </span>
                  ) : null}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
              >
                Account
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
