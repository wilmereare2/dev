"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { AccountSyncNotice } from "@/features/settings/account-sync-notice";
import { AvatarUpload } from "@/features/settings/avatar-upload";

type ProfileFormProps = {
  initialName: string;
  initialBio: string;
  initialImage?: string | null;
  email: string;
  accountSynced?: boolean;
};

export function ProfileForm({
  initialName,
  initialBio,
  initialImage,
  email,
  accountSynced = true,
}: ProfileFormProps) {
  const { update } = useSession();
  const { locale, t, setLocale } = useI18n();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [localePending, setLocalePending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/user/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });

    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? t("settings.profileSaveError"));
      return;
    }

    await update({ name: name.trim() || null });
    setMessage(t("settings.profileUpdated"));
  }

  async function onLocaleChange(next: Locale) {
    if (next === locale) return;
    setLocalePending(true);
    await setLocale(next);
    setLocalePending(false);
  }

  return (
    <div className="max-w-xl space-y-6">
      {!accountSynced ? <AccountSyncNotice email={email} /> : null}

      <AvatarUpload
        initialImage={initialImage}
        name={name || initialName}
        email={email}
        disabled={!accountSynced}
      />

      <section className="space-y-2 rounded-xl border border-border bg-surface/40 p-4">
        <label htmlFor="locale" className="text-sm font-medium">
          {t("settings.language")}
        </label>
        <p className="text-sm text-muted-foreground">{t("settings.languageHelp")}</p>
        <select
          id="locale"
          value={locale}
          disabled={localePending}
          onChange={(event) => void onLocaleChange(event.target.value as Locale)}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </section>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t("settings.email")}</label>
          <p className="mt-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {email}
          </p>
        </div>
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            {t("settings.displayName")}
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="bio" className="text-sm font-medium">
            {t("settings.bio")}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit" disabled={pending || !accountSynced}>
          {pending ? t("settings.saving") : t("settings.saveProfile")}
        </Button>
      </form>
    </div>
  );
}
