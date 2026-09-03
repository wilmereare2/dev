/** Reusable ad placement slots — extend this map to add new locations. */
export const AD_PLACEMENTS = {
  homepage_top: {
    label: "Homepage top banner",
    description: "Wide banner below the hero section on the homepage.",
    aspectRatio: "21/9",
    variant: "banner" as const,
  },
  homepage_sidebar: {
    label: "Homepage sidebar",
    description: "Vertical slot beside homepage content on large screens.",
    aspectRatio: "4/5",
    variant: "sidebar" as const,
  },
  in_content: {
    label: "In-content",
    description: "Mid-page slot on content detail pages.",
    aspectRatio: "16/9",
    variant: "inline" as const,
  },
  footer: {
    label: "Footer",
    description: "Leaderboard-style banner above the site footer.",
    aspectRatio: "728/90",
    variant: "leaderboard" as const,
  },
  listing: {
    label: "Listing / search pages",
    description: "Banner on explore, category, and search result pages.",
    aspectRatio: "16/9",
    variant: "inline" as const,
  },
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

export const AD_PLACEMENT_KEYS = Object.keys(AD_PLACEMENTS) as AdPlacement[];

export const AD_STATUSES = ["draft", "active", "paused", "archived"] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

export function isAdPlacement(value: string): value is AdPlacement {
  return value in AD_PLACEMENTS;
}

export function getPlacementLabel(placement: string) {
  if (isAdPlacement(placement)) return AD_PLACEMENTS[placement].label;
  return placement;
}

export function getPlacementAspectRatio(placement: string) {
  if (isAdPlacement(placement)) return AD_PLACEMENTS[placement].aspectRatio;
  return "16/9";
}
