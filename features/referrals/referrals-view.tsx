"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Referral = {
  id: string;
  code: string;
  referredUserId?: string | null;
  createdAt: string;
};

type ReferralsViewProps = {
  code: string;
  referrals: Referral[];
};

export function ReferralsView({ code, referrals }: ReferralsViewProps) {
  const [applyCode, setApplyCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function applyReferral() {
    const response = await fetch("/api/user/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: applyCode }),
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Referral code applied." : payload.error ?? "Could not apply code.");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface/60 p-6">
        <h2 className="text-lg font-semibold">Your referral code</h2>
        <p className="mt-2 font-mono text-2xl">{code}</p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => navigator.clipboard.writeText(code).then(() => setMessage("Code copied."))}
        >
          Copy code
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-6">
        <h2 className="text-lg font-semibold">Apply a code</h2>
        <input
          value={applyCode}
          onChange={(event) => setApplyCode(event.target.value)}
          placeholder="Enter referral code"
          className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
        <Button type="button" className="mt-3" onClick={applyReferral}>
          Apply code
        </Button>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Referral history</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {referrals.length ? (
            referrals.map((referral) => (
              <li key={referral.id}>
                {referral.code} · {referral.referredUserId ? "Redeemed" : "Available"} ·{" "}
                {new Date(referral.createdAt).toLocaleDateString()}
              </li>
            ))
          ) : (
            <li>No referrals yet.</li>
          )}
        </ul>
      </section>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
