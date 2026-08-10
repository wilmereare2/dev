import { ArchiveIcon, UndoIcon } from "@sanity/icons";
import type { DocumentActionComponent } from "sanity";
import { useClient } from "sanity";
import { sanityApiVersion } from "../../lib/sanity/env";

const ARCHIVABLE_TYPES = new Set(["content", "category", "creator", "tag"]);

export const ArchiveDocumentAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: sanityApiVersion });

  if (!ARCHIVABLE_TYPES.has(props.type)) return null;

  const archived = Boolean(props.published?.archived ?? props.draft?.archived);

  return {
    label: archived ? "Restore from archive" : "Archive",
    icon: archived ? UndoIcon : ArchiveIcon,
    tone: archived ? "positive" : "caution",
    onHandle: () => {
      void client
        .patch(props.id)
        .set({
          archived: !archived,
          archivedAt: archived ? null : new Date().toISOString(),
        })
        .commit()
        .then(() => props.onComplete())
        .catch(() => props.onComplete());
    },
  };
};

export function documentActions(
  prev: DocumentActionComponent[],
  context: { schemaType: string },
): DocumentActionComponent[] {
  if (!ARCHIVABLE_TYPES.has(context.schemaType)) return prev;
  return [...prev, ArchiveDocumentAction];
}
