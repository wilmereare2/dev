"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/profile", key: "settings.profile" as const },
  { href: "/settings/privacy", key: "settings.privacy" as const },
  { href: "/settings/safety", key: "settings.safety" as const },
  { href: "/settings/notifications", key: "settings.notifications" as const },
  { href: "/settings/security", key: "settings.security" as const },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition",
            pathname === link.href
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-muted-foreground hover:text-foreground",
          )}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
