import Link from "next/link";
import { APP_NAME, APP_TAGLINE, FOOTER_LINKS } from "@/lib/constants";

export function Footer({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`relative border-t border-border/60 bg-gradient-to-b from-transparent to-surface/50 ${
        compact ? "mt-10" : "mt-16"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div
        className={`mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8 ${
          compact ? "py-10" : "py-14"
        }`}
      >
        <div className="md:col-span-1">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            manuela<span className="text-accent">X</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {APP_TAGLINE}
          </p>
        </div>

        <FooterColumn title="Discover" links={FOOTER_LINKS.discover} />
        <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <p>18+ only. Content is uploaded and managed by editors via CMS.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
