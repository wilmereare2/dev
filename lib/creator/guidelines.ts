export const CREATOR_GUIDELINES = {
  title: "Creator guidelines",
  summary:
    "Upload original adult content you own or have rights to publish. All uploads are reviewed before they appear on Explore and category pages.",
  steps: [
    { title: "Enable creator tools", detail: "One click from this page — free for verified members 18+." },
    { title: "Choose a category", detail: "Pick where your content should appear (Fitness, Lifestyle, Premium, etc.)." },
    { title: "Upload media or write a text post", detail: "Photos, videos, audio, GIFs, or text announcements." },
    { title: "Submit for review", detail: "Moderators approve safe, policy-compliant content within 24–48 hours." },
    { title: "Publish & monetize", detail: "Set public, followers-only, subscriber-only, or PPV pricing after approval." },
  ],
  allowedMedia: [
    "Photos: JPEG, PNG, WebP, GIF (max 5 MB)",
    "Videos: MP4, WebM, MOV via file (max 100 MB) or external URL (Mux/CDN)",
    "Audio: MP3, WAV, WebM (max 20 MB)",
    "Text posts: title + body — no file required",
  ],
  rules: [
    "All people depicted must be 18+ with documented consent.",
    "No illegal content, non-consensual material, or malware.",
    "Use accurate titles, tags, and categories — misleading metadata is removed.",
    "Premium and PPV pricing must match the content delivered.",
  ],
  structure: [
    { label: "Explore / Categories", desc: "Where members discover approved public content." },
    { label: "Creator dashboard", desc: "Upload, drafts, promotions, earnings, analytics." },
    { label: "Library", desc: "Member favorites, watch later, and history (not for uploading)." },
    { label: "Moderation queue", desc: "Every upload is checked before it goes live." },
  ],
} as const;

export const DEFAULT_UPLOAD_CATEGORIES = [
  { slug: "fitness", title: "Fitness" },
  { slug: "lifestyle", title: "Lifestyle" },
  { slug: "premium", title: "Premium" },
  { slug: "behind-the-scenes", title: "Behind the scenes" },
  { slug: "teaser", title: "Teasers & previews" },
  { slug: "announcements", title: "Announcements" },
] as const;
