import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { LibraryUnavailable } from "@/features/library/library-unavailable";
import { LibraryView } from "@/features/library/library-view";
import { loadLibraryData } from "@/services/user/library-page";
import { fetchContentByIds } from "@/services/sanity/catalog";
import type { SanityContentCard } from "@/types/sanity-content";

function isContentCard(value: SanityContentCard | undefined): value is SanityContentCard {
  return Boolean(value);
}

export const metadata: Metadata = {
  title: "Library",
  description: "Your favorites, watch later, and history on manuelaX.",
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const session = await requireSession();
  const userId =
    (await resolveDbUserId({ id: session.user.id, email: session.user.email })) ?? session.user.id;

  const library = await loadLibraryData(userId);
  if (!library.ok) {
    return <LibraryUnavailable />;
  }

  const { bookmarks, watchLater, history } = library;

  const allIds = [
    ...new Set([
      ...bookmarks.map((b) => b.contentId),
      ...watchLater.map((w) => w.contentId),
      ...history.map((h) => h.contentId),
    ]),
  ];

  const content = await fetchContentByIds(allIds);
  const contentMap = new Map(content.map((item) => [item._id, item]));

  return (
    <LibraryView
      favorites={bookmarks.map((b) => contentMap.get(b.contentId)).filter(isContentCard)}
      watchLater={watchLater.map((w) => contentMap.get(w.contentId)).filter(isContentCard)}
      history={history
        .map((h) => {
          const item = contentMap.get(h.contentId);
          return item ? { item, progressMs: h.progressMs } : null;
        })
        .filter((entry): entry is { item: SanityContentCard; progressMs: number } => entry !== null)}
    />
  );
}
