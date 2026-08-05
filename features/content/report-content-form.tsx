"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ReportContentFormProps = {
  contentId?: string;
  targetUserId?: string;
  signedIn: boolean;
};

export function ReportContentForm({ contentId, targetUserId, signedIn }: ReportContentFormProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!signedIn) {
    return <p className="text-sm text-muted-foreground">Sign in to report content.</p>;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/content/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, targetUserId, reason, details }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not submit report.");
      return;
    }

    setMessage("Report submitted. Our moderation team will review it.");
    setReason("");
    setDetails("");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <input
          id="reason"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="details" className="text-sm font-medium">
          Details
        </label>
        <textarea
          id="details"
          rows={5}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
