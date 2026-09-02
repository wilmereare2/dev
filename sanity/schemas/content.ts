import { defineField, defineType } from "sanity";
import { FastVideoFileInput } from "@/sanity/components/fast-video-file-input";
import { VideoUrlInput } from "@/sanity/components/video-url-input";
import { pixelImageField } from "@/sanity/lib/pixel-image-field";
import { slugifyForUrl } from "@/sanity/lib/slugify";

/**
 * Content is media-metadata only in Phase 1 schemas.
 * Editors MUST upload thumbnail + video via Sanity Studio.
 * This repo never ships photos or videos.
 */
export const content = defineType({
  name: "content",
  title: "Content",
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
      options: { source: "title", maxLength: 96, slugify: slugifyForUrl },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "synopsis",
      title: "Synopsis",
      type: "text",
      rows: 4,
    }),
    pixelImageField({
      name: "thumbnail",
      title: "Thumbnail",
      description: "JPG or PNG cover image only — not video. Use Pixel controls below for exact output size.",
      required: true,
      options: { accept: "image/*" },
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description: "YouTube, Vimeo, Pexels page link, or direct MP4/CDN URL.",
      components: { input: VideoUrlInput },
    }),
    defineField({
      name: "video",
      title: "Video file",
      type: "file",
      description: "Upload MP4/WebM to Sanity. Uses fast upload — no full-file scan before transfer.",
      options: {
        accept: "video/*",
      },
      components: { input: FastVideoFileInput },
    }),
    defineField({
      name: "durationSeconds",
      title: "Duration (seconds)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "creators",
      title: "Creators",
      type: "array",
      of: [{ type: "reference", to: [{ type: "creator" }] }],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isPremium",
      title: "Premium only",
      type: "boolean",
      initialValue: false,
      description: "Requires an active subscription to play.",
    }),
    defineField({
      name: "status",
      title: "Workflow status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending review", value: "pending_review" },
          { title: "Approved", value: "approved" },
          { title: "Published", value: "published" },
          { title: "Rejected", value: "rejected" },
          { title: "Flagged", value: "flagged" },
          { title: "Removed", value: "removed" },
        ],
      },
      initialValue: "published",
    }),
    defineField({
      name: "ownerUserId",
      title: "Owner user ID",
      type: "string",
      description: "Platform user ID of the verified creator who owns this upload.",
    }),
    defineField({
      name: "visibility",
      title: "Visibility",
      type: "string",
      options: {
        list: [
          { title: "Public", value: "public" },
          { title: "Followers", value: "followers" },
          { title: "Subscribers", value: "subscribers" },
          { title: "Private", value: "private" },
        ],
      },
      initialValue: "public",
    }),
    defineField({
      name: "ppvPriceCents",
      title: "PPV price (cents)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "scheduledAt",
      title: "Scheduled publish",
      type: "datetime",
    }),
    defineField({
      name: "streamAssetId",
      title: "Stream asset ID",
      type: "string",
      description: "Mux or Cloudflare Stream playback ID for signed delivery.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
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
      description: "Use the Archive action in the toolbar — nothing is archived automatically.",
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
  preview: {
    select: {
      title: "title",
      media: "thumbnail",
    },
  },
});
