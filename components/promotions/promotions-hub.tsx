"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { PageHeader } from "@/components/layout/page-header";
import { BillingReturnBanner } from "@/components/billing/billing-return-banner";
import { Badge, visibilityBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { PromotionListEntry } from "@/components/promotions/promotion-entry-utils";
import {
  entryHref,
  entryMonetization,
  entryOwner,
  entryVisibility,
  isExternalEntry,
} from "@/components/promotions/promotion-entry-utils";
import { formatRelativeDate } from "@/utils/format";
import { cn } from "@/lib/utils";

type VisibilityFilter = "all" | "public" | "followers" | "subscribers";

const FILTERS: { id: VisibilityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "followers", label: "Followers" },
  { id: "subscribers", label: "Subscribers" },
];

type PromotionsHubProps = {
  entries: PromotionListEntry[];
};

export function PromotionsHub({ entries }: PromotionsHubProps) {
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const visibility = entryVisibility(entry).toLowerCase();
      if (filter !== "all" && visibility !== filter) return false;
      if (!normalized) return true;
      const haystack = [
        entry.item.title,
        "body" in entry.item ? entry.item.body : "",
        "description" in entry.item ? entry.item.description : "",
        entryOwner(entry),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [entries, filter, query]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BillingReturnBanner successMessage="Payment complete. Your access has been updated." />
      <PageHeader
        eyebrow="Promotions"
        title="Deals & member posts"
        description="Discover creator deals, promotions, and member-only content. Access rules apply on each post page."
      />

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Promotion filters" className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                filter === id
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search promotions…"
            className="pl-10"
            aria-label="Search promotions"
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
        {filter !== "all" ? ` · ${FILTERS.find((item) => item.id === filter)?.label}` : ""}
      </p>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No promotions found"
            description="Try another filter or check back later for new deals and member posts."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((entry) => (
                <PromotionMobileCard key={`${entry.kind}-${entry.item.id}`} entry={entry} />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Creator</th>
                    <th className="px-4 py-3 font-semibold">Visibility</th>
                    <th className="px-4 py-3 font-semibold">Monetization</th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Published</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <PromotionTableRow key={`${entry.kind}-${entry.item.id}`} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Creators can submit coupon campaigns from{" "}
        <Link href="/creator-dashboard/promotions" className="text-accent hover:underline">
          Creator dashboard → Promotions
        </Link>
        .
      </p>
    </section>
  );
}

function PromotionTableRow({ entry }: { entry: PromotionListEntry }) {
  const href = entryHref(entry);
  const external = isExternalEntry(entry);
  const monetization = entryMonetization(entry);
  const visibility = entryVisibility(entry);

  return (
    <tr className="border-t border-border/60 transition hover:bg-muted/20">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{entry.item.title}</div>
        {"body" in entry.item && entry.item.body ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.item.body}</p>
        ) : null}
        {"description" in entry.item && entry.item.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.item.description}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {entry.kind === "post" ? (
            <UserAvatar name={entry.item.creator.name} email={null} image={entry.item.creator.image} size="sm" />
          ) : null}
          <span>{entryOwner(entry)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={visibilityBadgeVariant(visibility)}>{visibility}</Badge>
      </td>
      <td className="px-4 py-3">
        <MonetizationBadges monetization={monetization} />
      </td>
      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
        {formatRelativeDate(entry.publishedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <ViewLink href={href} external={external} />
      </td>
    </tr>
  );
}

function PromotionMobileCard({ entry }: { entry: PromotionListEntry }) {
  const href = entryHref(entry);
  const external = isExternalEntry(entry);
  const monetization = entryMonetization(entry);
  const visibility = entryVisibility(entry);

  return (
    <article className="rounded-2xl border border-border/60 bg-surface/40 p-4 transition hover:border-accent/30">
      <div className="flex items-start gap-3">
        {entry.kind === "post" ? (
          <UserAvatar name={entry.item.creator.name} email={null} image={entry.item.creator.image} size="md" />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
            AD
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold leading-tight">{entry.item.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{entryOwner(entry)}</p>
        </div>
      </div>

      {"body" in entry.item && entry.item.body ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{entry.item.body}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={visibilityBadgeVariant(visibility)}>{visibility}</Badge>
        <MonetizationBadges monetization={monetization} />
        <span className="text-xs text-muted-foreground">{formatRelativeDate(entry.publishedAt)}</span>
      </div>

      <div className="mt-4">
        <ViewLink href={href} external={external} className="inline-flex" />
      </div>
    </article>
  );
}

function MonetizationBadges({ monetization }: { monetization: ReturnType<typeof entryMonetization> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {monetization.price ? (
        <Badge variant="ppv">{monetization.price}</Badge>
      ) : null}
      {monetization.tags.map((tag) => (
        <Badge key={tag} variant={tag === "Premium" ? "premium" : tag === "Offer" ? "accent" : "default"}>
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function ViewLink({
  href,
  external,
  className,
}: {
  href: string | null;
  external: boolean;
  className?: string;
}) {
  if (!href) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn("inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline", className)}
      >
        View
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }

  return (
    <Button asChild variant="secondary" size="sm" className={className}>
      <Link href={href}>View</Link>
    </Button>
  );
}
