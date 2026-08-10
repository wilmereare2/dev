import type { StructureResolver } from "sanity/structure";

const ARCHIVABLE = ["content", "category", "creator", "tag"] as const;

function activeList(S: Parameters<StructureResolver>[0], schemaType: string, title: string) {
  return S.documentTypeList(schemaType)
    .title(title)
    .filter("_type == $type && coalesce(archived, false) != true")
    .params({ type: schemaType });
}

function archivedList(S: Parameters<StructureResolver>[0], schemaType: string, title: string) {
  return S.documentTypeList(schemaType)
    .title(title)
    .filter("_type == $type && archived == true")
    .params({ type: schemaType });
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("manuelaX CMS")
    .items([
      S.listItem()
        .title("Site settings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      ...ARCHIVABLE.flatMap((schemaType) => {
        const label = schemaType.charAt(0).toUpperCase() + schemaType.slice(1);
        return [
          S.listItem()
            .title(label)
            .child(
              S.list()
                .title(label)
                .items([
                  S.listItem()
                    .title(`Active ${label.toLowerCase()}`)
                    .child(activeList(S, schemaType, `Active ${label.toLowerCase()}`)),
                  S.listItem()
                    .title(`Archived ${label.toLowerCase()}`)
                    .child(archivedList(S, schemaType, `Archived ${label.toLowerCase()}`)),
                ]),
            ),
        ];
      }),
    ]);
