import { defineField, defineType } from "sanity";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";

export const category = defineType({
  name: "category",
  title: "Category",
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
      rows: 3,
    }),
    pixelImageField({
      name: "coverImage",
      title: "Cover image",
      description: "Category banner. Recommended output: 1200×400 px.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
    defineField({
      name: "archived",
      title: "Archived",
      type: "boolean",
      initialValue: false,
      description: "Archived manually from the Studio toolbar. Archived items are hidden on the site.",
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
