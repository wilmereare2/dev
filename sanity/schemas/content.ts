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
      description: "Hosted stream or direct MP4 link (YouTube, CDN, etc.).",
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
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "thumbnail",
    },
  },
});
