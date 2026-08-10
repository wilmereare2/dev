import { defineField, defineType } from "sanity";

export const tag = defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "archived",
      title: "Archived",
      type: "boolean",
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: "archivedAt",
      title: "Archived at",
      type: "datetime",
      readOnly: true,
      hidden: ({ document }) => !document?.archived,
    }),
  ],
});
