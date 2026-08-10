"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Bookmark, LogOut, MessageSquare, PenSquare, Settings, Shield, User } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { clearAgeVerificationCookie } from "@/features/compliance/verify-age-form";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="hidden size-9 animate-pulse rounded-full bg-muted sm:block" aria-hidden />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/account"
        className="hidden rounded-full border border-border bg-surface/70 px-4 py-2 text-sm font-medium transition hover:border-accent/40 sm:inline-flex sm:items-center sm:gap-2"
      >
        <User className="size-4" />
        {t("common.signIn")}
      </Link>
    );
  }

  const user = session.user;
  const label = user.name || user.email || "Account";
  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-border bg-surface/70 py-1 pl-1 pr-3 transition hover:border-accent/40"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar
          name={user.name}
          email={user.email}
          image={user.image}
          size="sm"
          imageScale={user.avatarScale ?? 100}
        />
        <span className="max-w-[120px] truncate text-sm font-medium">{label}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={user.name}
                email={user.email}
                image={user.image}
                size="md"
                imageScale={user.avatarScale ?? 100}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{label}</p>
                {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
              </div>
            </div>
          </div>
          <div className="py-1">
            <MenuLink href="/create" icon={PenSquare} onClick={() => setOpen(false)}>
              {t("common.create")}
            </MenuLink>
            <MenuLink href="/library" icon={Bookmark} onClick={() => setOpen(false)}>
              {t("nav.library")}
            </MenuLink>
            <MenuLink href="/messages" icon={MessageSquare} onClick={() => setOpen(false)}>
              {t("nav.messages")}
            </MenuLink>
            <MenuLink href="/settings/profile" icon={Settings} onClick={() => setOpen(false)}>
              {t("nav.settings")}
            </MenuLink>
            <MenuLink href="/subscriptions" icon={User} onClick={() => setOpen(false)}>
              {t("menu.subscriptions")}
            </MenuLink>
            {isStaff ? (
              <MenuLink href="/admin/users" icon={Shield} onClick={() => setOpen(false)}>
                {t("menu.adminCustomers")}
              </MenuLink>
            ) : null}
          </div>
          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={async () => {
                setOpen(false);
                await clearAgeVerificationCookie();
                await signOut({ callbackUrl: "/account" });
              }}
            >
              <LogOut className="size-4" />
              {t("common.signOut")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}

export function MobileUserLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  if (!session?.user) {
    return (
      <Link
        href="/account"
        onClick={onNavigate}
        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
      >
        {t("common.signIn")}
      </Link>
    );
  }

  return (
    <>
      <Link href="/create" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-accent">
        {t("common.create")}
      </Link>
      <Link href="/library" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm">
        {t("nav.library")}
      </Link>
      <Link href="/messages" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm">
        {t("nav.messages")}
      </Link>
      <Link href="/settings/profile" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm">
        {t("nav.settings")}
      </Link>
      <Link href="/subscriptions" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm">
        {t("menu.subscriptions")}
      </Link>
      {isStaff ? (
        <Link href="/admin/users" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-sm">
          {t("menu.adminCustomers")}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={async () => {
          onNavigate?.();
          await clearAgeVerificationCookie();
          await signOut({ callbackUrl: "/account" });
        }}
        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground"
      >
        {t("common.signOut")}
      </button>
    </>
  );
}
