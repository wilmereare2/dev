export type StubPageSlug =
  | "explore"
  | "categories"
  | "tags"
  | "trending"
  | "newest"
  | "popular"
  | "blog"
  | "search"
  | "about"
  | "contact"
  | "faq"
  | "privacy"
  | "terms"
  | "dmca";

export type StubPageConfig = {
  title: string;
  description: string;
  phase: number;
};

export const STUB_PAGES: Record<StubPageSlug, StubPageConfig> = {
  explore: {
    title: "Explore",
    description: "Curated feeds and discovery — powered entirely by Sanity CMS content.",
    phase: 2,
  },
  categories: {
    title: "Categories",
    description: "Browse normalized categories managed by editors in Studio.",
    phase: 2,
  },
  tags: {
    title: "Tags",
    description: "Faceted tag browsing with filters and sorting.",
    phase: 2,
  },
  trending: {
    title: "Trending",
    description: "Velocity-based ranking from analytics and engagement signals.",
    phase: 2,
  },
  newest: {
    title: "Newest",
    description: "Latest uploads and publishes from the CMS pipeline.",
    phase: 2,
  },
  popular: {
    title: "Popular",
    description: "All-time and windowed popularity views.",
    phase: 2,
  },
  blog: {
    title: "Blog",
    description: "Editorial articles, announcements, and long-form content.",
    phase: 2,
  },
  search: {
    title: "Search",
    description: "Instant search with filters, suggestions, and infinite scroll.",
    phase: 2,
  },
  about: {
    title: "About",
    description: "Brand story and platform overview — editable via CMS pages.",
    phase: 2,
  },
  contact: {
    title: "Contact",
    description: "Support and business inquiries with validated forms.",
    phase: 2,
  },
  faq: {
    title: "FAQ",
    description: "Structured FAQ documents from Sanity.",
    phase: 2,
  },
  privacy: {
    title: "Privacy Policy",
    description: "Legal pages managed as CMS documents with version history.",
    phase: 2,
  },
  terms: {
    title: "Terms of Service",
    description: "Terms content owned by editors, not hard-coded in the repo.",
    phase: 2,
  },
  dmca: {
    title: "DMCA",
    description: "Takedown process and contact workflow.",
    phase: 2,
  },
};
