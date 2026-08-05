"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PrivacyFormProps = {
  initial: {
    showActivity: boolean;
    anonymousMode: boolean;
    hideSubscriptions: boolean;
  };
};

export function PrivacyForm({ initial }: PrivacyFormProps) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/user/settings/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setPending(false);
    setMessage(response.ok ? "Privacy settings saved." : "Could not save settings.");
  }

  const toggles: { key: keyof typeof values; label: string; description: string }[] = [
    {
      key: "showActivity",
      label: "Show activity",
      description: "Allow others to see your likes and follows when enabled.",
    },
    {
      key: "anonymousMode",
      label: "Anonymous mode",
      description: "Hide your profile name on public activity.",
    },
    {
      key: "hideSubscriptions",
      label: "Hide subscriptions",
      description: "Keep your subscription status private.",
    },
  ];

  return (
    <div className="max-w-xl space-y-4">
      {toggles.map((toggle) => (
        <label
          key={toggle.key}
          className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-4"
        >
          <span>
            <span className="block text-sm font-medium">{toggle.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{toggle.description}</span>
          </span>
          <input
            type="checkbox"
            checked={values[toggle.key]}
            onChange={(event) => setValues((current) => ({ ...current, [toggle.key]: event.target.checked }))}
            className="mt-1 size-4 accent-accent"
          />
        </label>
      ))}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <Button type="button" onClick={save} disabled={pending}>
        {pending ? "Saving..." : "Save privacy settings"}
      </Button>
    </div>
  );
}
