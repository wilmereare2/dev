"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";

type ContactFormProps = {
  defaultEmail?: string;
};

export function ContactForm({ defaultEmail = "" }: ContactFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await requestJson("/api/support/tickets", {
        method: "POST",
        body: { email, subject, message },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNotice("Support ticket submitted. We will reply by email.");
      setSubject("");
      setMessage("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
