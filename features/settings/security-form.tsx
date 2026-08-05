"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { clearAgeVerificationCookie } from "@/features/compliance/verify-age-form";
import { Button } from "@/components/ui/button";

type SecurityFormProps = {
  twoFactorEnabled: boolean;
};

export function SecurityForm({ twoFactorEnabled }: SecurityFormProps) {
  const [enabled, setEnabled] = useState(twoFactorEnabled);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function setupTwoFactor() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/user/2fa", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not start 2FA setup.");
      return;
    }

    setSecret(payload.secret);
    setOtpauth(payload.otpauth);
    setMessage("Scan the secret in your authenticator app, then confirm with a code.");
  }

  async function confirmTwoFactor(action: "enable" | "disable") {
    setPending(true);
    setError(null);

    const response = await fetch("/api/user/2fa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Invalid code.");
      return;
    }

    setEnabled(action === "enable");
    setSecret(null);
    setOtpauth(null);
    setToken("");
    setMessage(action === "enable" ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
  }

  async function exportData() {
    const response = await fetch("/api/user/account");
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "manuelax-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;

    setPending(true);
    const response = await fetch("/api/user/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password || undefined }),
    });
    setPending(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Could not delete account.");
      return;
    }

    await clearAgeVerificationCookie();
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-surface/60 p-5">
        <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        <p className="text-sm text-muted-foreground">
          {enabled ? "2FA is enabled on your account." : "Add an authenticator app for extra protection."}
        </p>
        {!enabled && !secret ? (
          <Button type="button" onClick={setupTwoFactor} disabled={pending}>
            Set up 2FA
          </Button>
        ) : null}
        {secret ? (
          <div className="space-y-3 text-sm">
            <p className="break-all rounded-xl bg-muted/40 p-3 font-mono">{secret}</p>
            {otpauth ? <p className="break-all text-muted-foreground">{otpauth}</p> : null}
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="6-digit code"
              className="h-11 w-full rounded-xl border border-border bg-background px-3"
            />
            <Button type="button" onClick={() => confirmTwoFactor("enable")} disabled={pending}>
              Enable 2FA
            </Button>
          </div>
        ) : null}
        {enabled ? (
          <div className="space-y-3">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="6-digit code to disable"
              className="h-11 w-full rounded-xl border border-border bg-background px-3"
            />
            <Button type="button" variant="secondary" onClick={() => confirmTwoFactor("disable")} disabled={pending}>
              Disable 2FA
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface/60 p-5">
        <h2 className="text-lg font-semibold">Account data</h2>
        <p className="text-sm text-muted-foreground">Export a JSON copy of your account data or delete your account.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={exportData}>
            Export data
          </Button>
        </div>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Password (required for password accounts)"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
        <Button type="button" variant="secondary" onClick={deleteAccount} disabled={pending}>
          Delete account
        </Button>
      </section>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
