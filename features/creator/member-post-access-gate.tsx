"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorFollowButton } from "@/features/creator/creator-follow-button";
import { applyMonetizationResponse } from "@/lib/billing/monetization-client";
import { CREATOR_MONETIZATION_UNAVAILABLE } from "@/services/billing/creator-monetization";
import type { MemberPostAccessDenialReason } from "@/services/creator/monetization";

type MemberPostAccessGateProps = {
  uploadId: string;
  creatorUserId: string;
  creatorSlug: string | null;
  reason: MemberPostAccessDenialReason;
  ppvPriceCents: number | null;
  signedIn: boolean;
  redirectPath: string;
  monetizationEnabled: boolean;
};

const COPY: Record<MemberPostAccessDenialReason, { title: string; description: string }> = {
  sign_in: {
    title: "Sign in to view this post",
    description: "Create a free account or sign in to access member content.",
  },
  email_verification: {
    title: "Verify your email to view this post",
    description:
      "Posts promoted by other members need a verified email address. Content published by manuelaX stays free to browse.",
  },
  ppv: {
    title: "Pay-per-view content",
    description: "Purchase this post to unlock the full media.",
  },
  premium: {
    title: "Premium content",
    description: "Subscribe to the platform or this creator to unlock this post.",
  },
  followers: {
    title: "Followers only",
    description: "Follow this creator to unlock this post.",
  },
  subscribers: {
    title: "Subscribers only",
    description: "Subscribe to this creator to unlock this post.",
  },
};

export function MemberPostAccessGate({
  uploadId,
  creatorUserId,
  creatorSlug,
  reason,
  ppvPriceCents,
  signedIn,
  redirectPath,
  monetizationEnabled,
}: MemberPostAccessGateProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"purchase" | "subscribe" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const copy = COPY[reason];

  async function handlePurchase() {
    setPending("purchase");
    setMessage(null);
    try {
      const response = await fetch("/api/user/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purchase", uploadId }),
      });
      const payload = (await response.json()) as Parameters<typeof applyMonetizationResponse>[0];
      if (!response.ok) {
        setMessage(payload.error ?? "Could not complete purchase.");
        return;
      }
      const applied = applyMonetizationResponse(payload, router);
      if (!applied.ok) {
        setMessage(applied.error ?? "Could not complete purchase.");
      }
    } finally {
      setPending(null);
    }
  }

  async function handleSubscribe() {
    setPending("subscribe");
    setMessage(null);
    try {
      const response = await fetch("/api/user/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", creatorUserId }),
      });
      const payload = (await response.json()) as Parameters<typeof applyMonetizationResponse>[0];
      if (!response.ok) {
        setMessage(payload.error ?? "Could not subscribe.");
        return;
      }
      const applied = applyMonetizationResponse(payload, router);
      if (!applied.ok) {
        setMessage(applied.error ?? "Could not subscribe.");
      }
    } finally {
      setPending(null);
    }
  }

  const signInHref = `/account?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
        {reason === "premium" ? (
          <Crown className="size-6" aria-hidden />
        ) : reason === "email_verification" ? (
          <MailCheck className="size-6" aria-hidden />
        ) : (
          <Lock className="size-6" aria-hidden />
        )}
      </div>
      <div>
        <p className="font-display text-lg font-semibold">{copy.title}</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!signedIn ? (
          <Button asChild variant="premium">
            <Link href={signInHref}>Sign in</Link>
          </Button>
        ) : null}

        {reason === "email_verification" && signedIn ? (
          <>
            <Button asChild variant="premium">
              <Link href={`/account?verify=1&redirect=${encodeURIComponent(redirectPath)}`}>
                Verify my email
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/explore">Browse free content</Link>
            </Button>
          </>
        ) : null}

        {reason === "ppv" && signedIn && ppvPriceCents != null && ppvPriceCents > 0 ? (
          monetizationEnabled ? (
            <Button type="button" variant="premium" disabled={pending === "purchase"} onClick={handlePurchase}>
              {pending === "purchase" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                `Unlock for $${(ppvPriceCents / 100).toFixed(2)}`
              )}
            </Button>
          ) : (
            <Button type="button" variant="premium" disabled>
              Unlock for ${(ppvPriceCents / 100).toFixed(2)}
            </Button>
          )
        ) : null}

        {reason === "premium" && signedIn ? (
          <>
            <Button asChild variant="premium">
              <Link href="/subscriptions">Platform plans</Link>
            </Button>
            {monetizationEnabled ? (
              <Button type="button" variant="secondary" disabled={pending === "subscribe"} onClick={handleSubscribe}>
                {pending === "subscribe" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Subscribe to creator"}
              </Button>
            ) : null}
          </>
        ) : null}

        {reason === "followers" ? <CreatorFollowButton creatorUserId={creatorUserId} /> : null}

        {reason === "subscribers" && signedIn && monetizationEnabled ? (
          <Button type="button" variant="premium" disabled={pending === "subscribe"} onClick={handleSubscribe}>
            {pending === "subscribe" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Subscribe to creator"}
          </Button>
        ) : null}

        {creatorSlug ? (
          <Button asChild variant="outline">
            <Link href={`/creator/${creatorSlug}`}>View creator profile</Link>
          </Button>
        ) : null}
      </div>

      {!monetizationEnabled && (reason === "ppv" || reason === "subscribers" || reason === "premium") ? (
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {process.env.NODE_ENV === "development"
            ? CREATOR_MONETIZATION_UNAVAILABLE
            : "Checkout is not live yet. The site owner must enable billing before purchases can be completed."}
        </p>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
