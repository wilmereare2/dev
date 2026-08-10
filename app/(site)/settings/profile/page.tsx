import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { getUserProfile } from "@/services/user/settings";
import { ProfileForm } from "@/features/settings/profile-form";

export const metadata: Metadata = {
  title: "Profile settings",
  robots: { index: false, follow: false },
};

export default async function ProfileSettingsPage() {
  const session = await requireSession();
  const userId = await resolveDbUserId({
    id: session.user.id,
    email: session.user.email,
  });
  const profile = userId ? await getUserProfile(userId) : null;
  const accountSynced = Boolean(userId);

  return (
    <ProfileForm
      email={profile?.email ?? session.user.email ?? ""}
      initialName={profile?.name ?? ""}
      initialBio={profile?.settings?.bio ?? ""}
      initialImage={profile?.image ?? session.user.image ?? null}
      initialAvatarScale={profile?.settings?.avatarScale ?? 100}
      accountSynced={accountSynced}
    />
  );
}
