import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";

const links = [
  { href: "/business-dashboard", label: "Overview" },
  { href: "/business-dashboard/campaigns", label: "Campaigns" },
];

export default async function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["BUSINESS", "ADMIN"]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Business dashboard</h1>
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
