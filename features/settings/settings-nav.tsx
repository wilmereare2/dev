"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/security", label: "Security" },
];

export function SettingsNav() {
  const pathname = usePathname();

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
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
