"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/error-state";

type Settings = Record<string, unknown>;

const LABELS: Record<string, string> = {
  siteName: "Site name",
  registrationOpen: "Registration open",
  creatorApplicationsOpen: "Creator applications open",
  commentsRequireApproval: "Comments require approval",
  moderationAiEnabled: "AI moderation enabled",
  maxUploadSizeMb: "Max upload size (MB)",
  ageVerificationRequired: "Age verification required",
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await requestJson<{ settings?: Settings }>("/api/admin/platform");
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSettings(result.data.settings ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(key: string, value: unknown) {
    const response = await fetch("/api/admin/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!response.ok) {
      setMessage("Failed to save setting.");
      return;
    }
    setMessage(`Saved ${LABELS[key] ?? key}.`);
    void load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Site configuration" description="Platform-wide settings. Changes are audit-logged." />

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} className="mt-2" />
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="space-y-4">
        {Object.entries(LABELS).map(([key, label]) => {
          const value = settings[key];
          const isBool = typeof value === "boolean";

          return (
            <div key={key} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{key}</p>
              </div>
              {isBool ? (
                <Button
                  size="sm"
                  variant={value ? "default" : "secondary"}
                  onClick={() => void save(key, !value)}
                >
                  {value ? "Enabled" : "Disabled"}
                </Button>
              ) : (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem("val") as HTMLInputElement;
                    void save(key, key === "maxUploadSizeMb" ? Number(input.value) : input.value);
                  }}
                >
                  <input
                    name="val"
                    defaultValue={String(value ?? "")}
                    className="h-9 w-40 rounded-lg border border-border bg-background px-2 text-sm"
                  />
                  <Button type="submit" size="sm">Save</Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
