import { defineField, defineType } from "sanity";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";

/** Reusable SEO object — no media; editors fill per document. */
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
    }),
    pixelImageField({
      name: "ogImage",
      title: "Open Graph image",
      description:
        "Social preview + homepage hero fallback. Use display presets and pixel controls below the image (recommended 1200×630).",
    }),
    defineField({
      name: "noIndex",
      title: "No index",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
