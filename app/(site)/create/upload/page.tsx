import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getCreatorAccessState } from "@/lib/auth/creator-access";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { CreatorUploadForm } from "@/features/dashboard/creator-upload-form";
import { CREATOR_GUIDELINES } from "@/lib/creator/guidelines";
import { fetchCategoriesIndex } from "@/services/sanity/catalog";
import { DEFAULT_UPLOAD_CATEGORIES } from "@/lib/creator/guidelines";

export const metadata: Metadata = {
  title: "Upload content",
  robots: { index: false, follow: false },
};

export default async function CreateUploadPage() {
  const session = await requireSession();
  const userId =
    (await resolveDbUserId({ id: session.user.id, email: session.user.email })) ?? session.user.id;
  const access = await getCreatorAccessState(userId);

  if (access.needsOnboarding) {
    redirect("/create");
  }

  const sanityCategories = await fetchCategoriesIndex();
  const categories =
    sanityCategories.length > 0
      ? sanityCategories.map((cat) => ({ slug: cat.slug, title: cat.title }))
      : DEFAULT_UPLOAD_CATEGORIES.map((cat) => ({ slug: cat.slug, title: cat.title }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">Create</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Upload to a category</h1>
      <p className="mt-2 text-sm text-muted-foreground">{CREATOR_GUIDELINES.summary}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <CreatorUploadForm categories={categories} redirectPrefix="/create/upload" />
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface/60 p-5 text-sm">
            <h2 className="font-semibold">Quick checklist</h2>
            <ul className="mt-3 list-inside list-decimal space-y-2 text-muted-foreground">
              <li>Pick at least one category</li>
              <li>Add a clear title and description</li>
              <li>Attach photo, video, audio, or write a text post</li>
              <li>Save draft → Submit for review</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface/60 p-5 text-sm">
            <h2 className="font-semibold">Visibility</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Public</strong> — anyone age-verified
              </li>
              <li>
                <strong className="text-foreground">Followers</strong> — people who follow you
              </li>
              <li>
                <strong className="text-foreground">Subscribers</strong> — paid creator subs
              </li>
              <li>
                <strong className="text-foreground">Private</strong> — only you (drafts)
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
