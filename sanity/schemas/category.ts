import { defineField, defineType } from "sanity";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  /** Editable in Studio without forcing Draft perspective (enables image upload/select/clear). */
  liveEdit: true,
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
  ],
});
