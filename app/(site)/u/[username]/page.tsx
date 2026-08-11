import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/user/user-avatar";
import { prisma } from "@/lib/db/prisma";
import { serializePublicUser } from "@/lib/user/public-select";
import { displayHandle } from "@/lib/user/username";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { username: true, name: true },
  });
  if (!user) return { title: "Member not found" };
  return {
    title: displayHandle(user.username, user.name),
    description: `Public profile for ${displayHandle(user.username, user.name)} on manuelaX.`,
  };
}

export default async function PublicMemberPage({ params }: PageProps) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: {
      id: true,
      username: true,
      name: true,
      gender: true,
      country: true,
      race: true,
      hobbies: true,
      image: true,
      role: true,
      settings: { select: { dateOfBirth: true } },
    },
  });

  if (!user) notFound();

  const profile = serializePublicUser(user);

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-4">
          <UserAvatar name={profile.name} email={null} image={profile.image} size="lg" />
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {displayHandle(profile.username, profile.name)}
            </p>
            {profile.name ? <p className="text-sm text-muted-foreground">{profile.name}</p> : null}
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Age</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.age ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gender</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.gender ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Country</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.country ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Race</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.race ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hobbies</dt>
          <dd className="mt-2 text-sm leading-relaxed text-foreground">{profile.hobbies ?? "—"}</dd>
        </div>

        <p className="mt-8 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          Contact this member using their @username in Messages. Email, phone, and messenger handles stay private.
        </p>
      </div>
    </div>
  );
}
