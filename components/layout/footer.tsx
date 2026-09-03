"use client";

import Link from "next/link";
import { APP_NAME, FOOTER_LINKS, PAYMENT_BADGES, SOCIAL_LINKS } from "@/lib/constants";
import { AdSlot } from "@/components/ads/ad-slot";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { TrustBar } from "@/components/layout/trust-bar";
import { useI18n } from "@/components/providers/i18n-provider";
import { navMessageKey } from "@/lib/i18n";

export function Footer({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer
      className={`relative border-t border-border/60 bg-gradient-to-b from-transparent to-surface/50 ${
        compact ? "mt-10" : "mt-16"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <AdSlot placement="footer" />
      </div>
      <div
        className={`mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8 ${
          compact ? "py-10" : "py-14"
        }`}
      >
        <div className="lg:col-span-2">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            manuela<span className="text-accent">X</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("app.tagline")}</p>
          <div className="mt-5">
            <p className="text-sm font-semibold text-foreground">{t("footer.stayInLoop")}</p>
            <FooterNewsletter />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-accent/40 hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title={t("footer.discover")} links={FOOTER_LINKS.discover} />
        <FooterColumn title={t("footer.company")} links={FOOTER_LINKS.company} />
        <FooterColumn title={t("footer.legal")} links={FOOTER_LINKS.legal} />
      </div>

      <TrustBar compact className="border-t-0" />

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {PAYMENT_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-md border border-border/60 bg-background/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {APP_NAME}. {t("footer.rights")}
            </p>
            <p>{t("footer.disclaimer")}</p>
          </div>
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
  const { t } = useI18n();

  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const key = navMessageKey(link.href);
          const label = key ? t(key) : link.label;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition hover:text-accent"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
