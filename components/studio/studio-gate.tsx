"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanityConfigured } from "@/lib/sanity/env";

const NextStudioRoot = dynamic(() => import("@/components/studio/next-studio-root"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
      <p className="text-sm">Loading Sanity Studio…</p>
    </div>
  ),
});

export function StudioGate() {
  if (!sanityConfigured) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-4 py-16">
        <h1 className="font-display text-2xl font-semibold">Sanity Studio — connect your project</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add your Sanity project ID to <code className="text-accent">.env</code>, restart{" "}
          <code>npm run dev</code>, then reload this page.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Create a project at{" "}
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              sanity.io/manage
            </a>
          </li>
          <li>
            In <code>f:\manuelaX\.env</code> set{" "}
            <code>NEXT_PUBLIC_SANITY_PROJECT_ID=your_id</code>
          </li>
          <li>Stop the dev server (Ctrl+C) and run <code>npm run dev</code> again</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="https://www.sanity.io/manage" target="_blank" rel="noreferrer">
              Open Sanity manage
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <NextStudioRoot />;
}
