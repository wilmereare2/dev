import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LibraryUnavailable() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Library unavailable</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        manuelaX could not connect to the PostgreSQL database. This usually means your Neon project is
        paused, the connection string in <code className="text-foreground">.env</code> is outdated, or
        the network cannot reach port 5432.
      </p>
      <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
        <li>Open the Neon dashboard and resume or wake the project.</li>
        <li>Copy a fresh pooled connection string into <code className="text-foreground">DATABASE_URL</code>.</li>
        <li>Run <code className="text-foreground">npx prisma migrate deploy</code> after updating the URL.</li>
        <li>Restart the dev server and refresh this page.</li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/library">Try again</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
