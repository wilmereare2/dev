"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-accent">
        Error
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Try again. If the problem persists, contact support.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Retry
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
