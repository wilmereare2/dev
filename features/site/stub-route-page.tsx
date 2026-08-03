import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { STUB_PAGES, type StubPageSlug } from "@/lib/site/stub-pages";

export function stubMetadata(slug: StubPageSlug): Metadata {
  const page = STUB_PAGES[slug];
  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: `${page.title} · ${APP_NAME}`,
      description: page.description,
    },
  };
}

export function StubRoutePage({ slug }: { slug: StubPageSlug }) {
  const page = STUB_PAGES[slug];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        <Clock className="size-3.5" aria-hidden />
        Coming soon
      </p>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-secondary sm:text-lg">{page.description}</p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This section is part of the {APP_NAME} launch roadmap. We&apos;re publishing creator content in
          phases — check back soon or explore the homepage for updates.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
