import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { SafetyForm } from "@/features/settings/safety-form";

export const metadata: Metadata = {
  title: "Blocked & muted",
  robots: { index: false, follow: false },
};

export default async function SafetySettingsPage() {
  await requireSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Blocked & muted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage who can reach you and which conversations stay quiet.
      </p>
      <div className="mt-8">
        <SafetyForm />
      </div>
    </div>
  );
}
