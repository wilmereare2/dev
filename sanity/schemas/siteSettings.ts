import { defineField, defineType } from "sanity";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  /** Singleton settings — editable immediately (not read-only on Published perspective). */
  liveEdit: true,
  fields: [
    defineField({
      name: "title",
      title: "Site title",
      type: "string",
      initialValue: "manuelaX",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "homepageHeroTitle",
      title: "Homepage hero title",
      type: "string",
      description: "Large headline on the home page.",
    }),
    defineField({
      name: "homepageHeroSubtitle",
      title: "Homepage hero subtitle",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "ageGateText",
      title: "Age gate text",
      type: "string",
      initialValue: "18+ only. By entering you confirm you are of legal age in your region.",
    }),
    pixelImageField({
      name: "logo",
      title: "Logo",
      description: "Upload logo in Studio. Set exact pixel output below the image.",
    }),
    defineField({
      name: "seo",
      title: "Default SEO",
      type: "seo",
      description:
        "Open Graph image also appears as the homepage hero until Featured content exists. If Upload is greyed out, switch the top bar from Published to Draft.",
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});
