import { SettingsNav } from "@/features/settings/settings-nav";
import { requireSession } from "@/lib/auth/guards";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-2 text-secondary">Manage your profile, privacy, notifications, and security.</p>
      <div className="mt-8">
        <SettingsNav />
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
