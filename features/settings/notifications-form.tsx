"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type NotificationsFormProps = {
  initial: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    uploadAlerts: boolean;
    liveAlerts: boolean;
    promoAlerts: boolean;
  };
};

export function NotificationsForm({ initial }: NotificationsFormProps) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/user/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setPending(false);
    setMessage(response.ok ? "Notification settings saved." : "Could not save settings.");
  }

  const toggles: { key: keyof typeof values; label: string }[] = [
    { key: "emailNotifications", label: "Email notifications" },
    { key: "pushNotifications", label: "Push notifications" },
    { key: "marketingEmails", label: "Marketing emails" },
    { key: "uploadAlerts", label: "New upload alerts" },
    { key: "liveAlerts", label: "Live stream alerts" },
    { key: "promoAlerts", label: "Promotional alerts" },
  ];

  return (
    <div className="max-w-xl space-y-4">
      {toggles.map((toggle) => (
        <label
          key={toggle.key}
          className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-4"
        >
          <span className="text-sm font-medium">{toggle.label}</span>
          <input
            type="checkbox"
            checked={values[toggle.key]}
            onChange={(event) => setValues((current) => ({ ...current, [toggle.key]: event.target.checked }))}
            className="size-4 accent-accent"
          />
        </label>
      ))}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <Button type="button" onClick={save} disabled={pending}>
        {pending ? "Saving..." : "Save notification settings"}
      </Button>
    </div>
  );
}
