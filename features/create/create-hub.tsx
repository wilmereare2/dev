"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CREATOR_GUIDELINES } from "@/lib/creator/guidelines";

type CreateHubProps = {
  signedIn: boolean;
  canUpload: boolean;
  needsOnboarding: boolean;
  verificationStatus?: string | null;
};

export function CreateHub({
  signedIn,
  canUpload,
  needsOnboarding,
  verificationStatus,
}: CreateHubProps) {
  const router = useRouter();
  const { update } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function enableCreatorTools() {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/creator/onboard", { method: "POST" });
      const payload = (await response.json()) as { error?: string; message?: string; role?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not enable creator tools.");
        return;
      }

      if (payload.role) {
        await update({ role: payload.role });
      }

      setMessage(payload.message ?? "Creator tools enabled.");
      router.refresh();
      router.push("/create/upload");
    } catch {
      setError("Could not enable creator tools.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">Create</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Upload content to manuelaX
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Members browse and subscribe. Creators upload photos, videos, text, and audio into categories.
        Everything is reviewed before it appears on Explore.
      </p>

      {!signedIn ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-6">
          <p className="text-sm text-muted-foreground">Sign in or register first, then enable creator tools.</p>
          <Button asChild className="mt-4">
            <Link href="/account">Sign in</Link>
          </Button>
        </div>
      ) : null}

      {signedIn && needsOnboarding ? (
        <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6">
          <h2 className="font-semibold">Step 1 — Enable creator tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer accounts can watch content. Creator tools let you upload to categories, set pricing, and
            track earnings. Free to enable — uploads still go through moderation.
          </p>
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
          <Button className="mt-4" disabled={pending} onClick={enableCreatorTools}>
            {pending ? "Enabling..." : "Enable creator tools & upload"}
          </Button>
        </div>
      ) : null}

      {signedIn && canUpload ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/create/upload">Upload content</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/creator-dashboard/content">Manage uploads</Link>
          </Button>
          {verificationStatus === "pending" ? (
            <span className="self-center text-sm text-amber-400">Creator verification pending — drafts OK</span>
          ) : null}
        </div>
      ) : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="font-semibold">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            {CREATOR_GUIDELINES.steps.map((step, index) => (
              <li key={step.title}>
                <span className="font-medium text-foreground">
                  {index + 1}. {step.title}
                </span>
                <p className="mt-1">{step.detail}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="font-semibold">Site structure</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {CREATOR_GUIDELINES.structure.map((item) => (
              <li key={item.label}>
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="font-semibold">Allowed uploads</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {CREATOR_GUIDELINES.allowedMedia.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="font-semibold">Content rules</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {CREATOR_GUIDELINES.rules.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
