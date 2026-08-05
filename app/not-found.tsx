import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Minimal 404 — no navbar/session so static build never fails on Vercel. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-accent">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-sm leading-relaxed text-secondary">
        The page you requested does not exist or was moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
