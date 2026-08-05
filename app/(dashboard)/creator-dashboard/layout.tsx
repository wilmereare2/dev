import Link from "next/link";
import { requireCreatorAccess } from "@/lib/auth/creator-access";

const links = [
  { href: "/create", label: "Create hub" },
  { href: "/creator-dashboard", label: "Overview" },
  { href: "/creator-dashboard/content", label: "My content" },
  { href: "/creator-dashboard/promotions", label: "Promotions" },
  { href: "/creator-dashboard/earnings", label: "Earnings" },
  { href: "/creator-dashboard/analytics", label: "Analytics" },
  { href: "/studio", label: "Sanity Studio" },
];

export default async function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireCreatorAccess();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Creator dashboard</h1>
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
