import {
  listBookmarks,
  listWatchHistory,
  listWatchLater,
} from "@/services/user/library";
import { isPrismaConnectionError } from "@/lib/db/connection-error";

export async function loadLibraryData(userId: string) {
  try {
    const [bookmarks, watchLater, history] = await Promise.all([
      listBookmarks(userId),
      listWatchLater(userId),
      listWatchHistory(userId),
    ]);
    return { ok: true as const, bookmarks, watchLater, history };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return { ok: false as const, reason: "database_unavailable" as const };
    }
    throw error;
  }
}
