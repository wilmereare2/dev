import { defineField, defineType } from "sanity";

export const promotionalPost = defineType({
  name: "promotionalPost",
  title: "Promotional post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "body", title: "Body", type: "text", rows: 4 }),
    defineField({ name: "banner", title: "Banner image", type: "image" }),
    defineField({ name: "teaserVideoUrl", title: "Teaser video URL", type: "url" }),
    defineField({ name: "couponCode", title: "Coupon code", type: "string" }),
    defineField({ name: "discountPercent", title: "Discount %", type: "number" }),
    defineField({ name: "externalUrl", title: "External link", type: "url" }),
    defineField({ name: "expiresAt", title: "Expires at", type: "datetime" }),
    defineField({
      name: "creator",
      title: "Creator",
      type: "reference",
      to: [{ type: "creator" }],
    }),
  ],
});
