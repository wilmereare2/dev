import { requireSession } from "@/lib/auth/guards";
import { getCreatorAccessState } from "@/lib/auth/creator-access";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { CreateHub } from "@/features/create/create-hub";

export default async function CreatePage() {
  const session = await requireSession();
  const userId =
    (await resolveDbUserId({ id: session.user.id, email: session.user.email })) ?? session.user.id;
  const access = await getCreatorAccessState(userId);

  return (
    <CreateHub
      signedIn
      canUpload={access.canUpload}
      needsOnboarding={access.needsOnboarding}
      verificationStatus={access.verificationStatus}
    />
  );
}
