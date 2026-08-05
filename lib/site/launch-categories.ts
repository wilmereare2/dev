/** Placeholder categories shown when the CMS catalog is still sparse. */
export const LAUNCH_CATEGORY_PILLS = [
  { title: "Fitness", slug: "fitness", tone: "from-rose-500/30 to-orange-600/20" },
  { title: "Lifestyle", slug: "lifestyle", tone: "from-violet-500/30 to-fuchsia-600/20" },
  { title: "Fashion", slug: "fashion", tone: "from-pink-500/30 to-rose-600/20" },
  { title: "Music", slug: "music", tone: "from-blue-500/30 to-indigo-600/20" },
  { title: "Art", slug: "art", tone: "from-amber-500/30 to-yellow-600/20" },
  { title: "Gaming", slug: "gaming", tone: "from-emerald-500/30 to-teal-600/20" },
  { title: "Wellness", slug: "wellness", tone: "from-cyan-500/30 to-sky-600/20" },
  { title: "Premium", slug: "premium", tone: "from-accent/40 to-accent/10" },
] as const;

export type LaunchCategoryDefinition = (typeof LAUNCH_CATEGORY_PILLS)[number];
