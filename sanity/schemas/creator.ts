import { defineField, defineType } from "sanity";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";

export const creator = defineType({
  name: "creator",
  title: "Creator",
  type: "document",
  liveEdit: true,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 4,
    }),
    pixelImageField({
      name: "avatar",
      title: "Avatar",
      description: "Creator profile photo. Recommended output: 512×512 px.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
});
