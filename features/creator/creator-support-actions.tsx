"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyMonetizationResponse } from "@/lib/billing/monetization-client";
import { CREATOR_MONETIZATION_UNAVAILABLE } from "@/services/billing/creator-monetization";

type CreatorSupportActionsProps = {
  creatorUserId: string;
  subscriptionPriceCents: number | null;
  monetizationEnabled: boolean;
};

const TIP_PRESETS = [500, 1000, 2500];

export function CreatorSupportActions({
  creatorUserId,
  subscriptionPriceCents,
  monetizationEnabled,
}: CreatorSupportActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"subscribe" | "tip" | "message" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [customTip, setCustomTip] = useState("10");

  const subscriptionLabel =
    subscriptionPriceCents != null
      ? `Subscribe · $${(subscriptionPriceCents / 100).toFixed(2)}/mo`
      : "Subscribe";

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
      if (applied.ok) {
        setMessage("Subscribed successfully.");
      } else {
        setMessage(applied.error ?? "Could not subscribe.");
      }
    } finally {
      setPending(null);
    }
  }

  async function handleTip(amountCents: number) {
    setPending("tip");
    setMessage(null);
    try {
      const response = await fetch("/api/user/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tip", creatorUserId, amountCents }),
      });
      const payload = (await response.json()) as Parameters<typeof applyMonetizationResponse>[0];
      if (!response.ok) {
        setMessage(payload.error ?? "Could not send tip.");
        return;
      }
      const applied = applyMonetizationResponse(payload, router);
      if (!applied.ok) {
        setMessage(applied.error ?? "Could not send tip.");
        return;
      }
      setMessage("Tip sent. Thank you for supporting this creator.");
      setShowTip(false);
    } finally {
      setPending(null);
    }
  }

  async function handleMessage() {
    setPending("message");
    setMessage(null);
    try {
      const response = await fetch("/api/chat/direct/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: creatorUserId }),
      });
      const payload = (await response.json()) as { conversation?: { id: string }; error?: string };
      if (!response.ok || !payload.conversation) {
        setMessage(payload.error ?? "Could not open messages.");
        return;
      }
      router.push(`/messages?conversation=${payload.conversation.id}`);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {monetizationEnabled ? (
          <>
            <Button type="button" variant="secondary" disabled={pending === "subscribe"} onClick={handleSubscribe}>
              {pending === "subscribe" ? <Loader2 className="size-4 animate-spin" /> : subscriptionLabel}
            </Button>
            <Button type="button" variant="outline" disabled={pending === "tip"} onClick={() => setShowTip((value) => !value)}>
              {pending === "tip" ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
              Send tip
            </Button>
          </>
        ) : null}
        <Button type="button" variant="outline" disabled={pending === "message"} onClick={handleMessage}>
          {pending === "message" ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
          Message
        </Button>
      </div>

      {!monetizationEnabled ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{CREATOR_MONETIZATION_UNAVAILABLE}</p>
      ) : null}

      {showTip && monetizationEnabled ? (
        <div className="rounded-2xl border border-border/60 bg-surface/50 p-4">
          <p className="text-sm font-medium">Choose a tip amount</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIP_PRESETS.map((amount) => (
              <Button
                key={amount}
                type="button"
                size="sm"
                variant="outline"
                disabled={pending === "tip"}
                onClick={() => handleTip(amount)}
              >
                ${(amount / 100).toFixed(0)}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={customTip}
              onChange={(event) => setCustomTip(event.target.value)}
              className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm"
              aria-label="Custom tip amount in dollars"
            />
            <Button
              type="button"
              size="sm"
              variant="premium"
              disabled={pending === "tip"}
              onClick={() => {
                const dollars = Number(customTip);
                if (!Number.isFinite(dollars) || dollars < 1) {
                  setMessage("Enter a tip of at least $1.");
                  return;
                }
                void handleTip(Math.round(dollars * 100));
              }}
            >
              Send custom tip
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <p className="text-xs text-muted-foreground">
        Need help? <Link href="/contact" className="text-accent hover:underline">Contact support</Link>
      </p>
    </div>
  );
}
