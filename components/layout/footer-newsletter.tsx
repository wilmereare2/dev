"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setNotice(payload.error ?? "Could not subscribe right now.");
        return;
      }
      setNotice(payload.message ?? "Thanks — you're on the list.");
      setEmail("");
    } catch {
      setNotice("Could not subscribe right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="footer-newsletter" className="sr-only">
        Email for launch updates
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email for launch updates"
          className="h-12 w-full flex-1 rounded-xl border border-border bg-background/80 px-4 text-base outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 sm:h-11 sm:text-sm"
        />
        <Button type="submit" disabled={pending} className="h-12 w-full shrink-0 sm:h-11 sm:w-auto">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Subscribe
        </Button>
      </div>
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
    </form>
  );
}
