import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/content", label: "Content moderation" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/users", label: "Customers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "MODERATOR"]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admin dashboard</h1>
      <nav className="mt-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </section>
  );
}
