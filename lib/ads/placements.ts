/**
 * Reusable ad placement slots — extend this map to add new locations.
 *
 * Sizes follow standard IAB units so advertisers can supply stock creatives.
 * `width`/`height` are the design size: they reserve exact space before the ad
 * loads, which is what keeps new slots from shifting the page as they fill.
 */
export const AD_PLACEMENTS = {
  // --- Full-width banners ---
  homepage_top: {
    label: "Homepage top banner",
    description: "Wide banner below the hero section on the homepage.",
    width: 970,
    height: 250,
    variant: "banner" as const,
    device: "all" as const,
  },
  below_nav: {
    label: "Below navigation (leaderboard)",
    description: "Leaderboard directly under the header. Highly visible without interrupting content.",
    width: 728,
    height: 90,
    variant: "leaderboard" as const,
    device: "desktop" as const,
  },
  between_sections: {
    label: "Between content sections",
    description: "Billboard between major sections of a listing page.",
    width: 970,
    height: 250,
    variant: "banner" as const,
    device: "desktop" as const,
  },
  footer: {
    label: "Footer",
    description: "Leaderboard-style banner above the site footer.",
    width: 728,
    height: 90,
    variant: "leaderboard" as const,
    device: "all" as const,
  },

  // --- Right-hand rail (desktop only) ---
  sidebar_tall: {
    label: "Sidebar — half page (top)",
    description: "Tall unit at the top of the right rail. The most prominent rail slot.",
    width: 300,
    height: 600,
    variant: "sidebar" as const,
    device: "desktop" as const,
  },
  sidebar_1: {
    label: "Sidebar — medium rectangle 1",
    description: "Standard 300×250 rail unit.",
    width: 300,
    height: 250,
    variant: "sidebar" as const,
    device: "desktop" as const,
  },
  sidebar_2: {
    label: "Sidebar — medium rectangle 2",
    description: "Second 300×250 rail unit, lower on the page.",
    width: 300,
    height: 250,
    variant: "sidebar" as const,
    device: "desktop" as const,
  },
  sidebar_3: {
    label: "Sidebar — medium rectangle 3",
    description: "Third 300×250 rail unit, deepest in the rail.",
    width: 300,
    height: 250,
    variant: "sidebar" as const,
    device: "desktop" as const,
  },
  homepage_sidebar: {
    label: "Homepage sidebar",
    description: "Vertical slot beside homepage content on large screens.",
    width: 300,
    height: 375,
    variant: "sidebar" as const,
    device: "desktop" as const,
  },

  // --- In-content ---
  in_content: {
    label: "In-content",
    description: "Large rectangle inside content detail pages, where readers are already engaged.",
    width: 336,
    height: 280,
    variant: "inline" as const,
    device: "all" as const,
  },
  listing: {
    label: "Listing / search pages",
    description: "Banner on explore, category, and search result pages.",
    width: 728,
    height: 90,
    variant: "inline" as const,
    device: "all" as const,
  },

  // --- Mobile-specific ---
  mobile_top: {
    label: "Mobile top",
    description: "Large mobile banner near the top of the page on narrow screens.",
    width: 320,
    height: 100,
    variant: "mobile" as const,
    device: "mobile" as const,
  },
  mobile_sticky_bottom: {
    label: "Mobile sticky bottom",
    description: "Stays visible while scrolling on narrow screens. Dismissible.",
    width: 320,
    height: 50,
    variant: "sticky" as const,
    device: "mobile" as const,
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
  if (!isAdPlacement(placement)) return "16/9";
  const { width, height } = AD_PLACEMENTS[placement];
  return `${width}/${height}`;
}

/** Human-readable recommended creative size, shown in the admin form. */
export function getPlacementSizeLabel(placement: string) {
  if (!isAdPlacement(placement)) return "";
  const { width, height } = AD_PLACEMENTS[placement];
  return `${width} × ${height} px`;
}

export function getPlacementDevice(placement: string) {
  if (!isAdPlacement(placement)) return "all" as const;
  return AD_PLACEMENTS[placement].device;
}

/**
 * Visibility class for a placement's target device.
 *
 * Enforced with CSS rather than a viewport check in JS: a media query is
 * correct on the very first paint, whereas reading `window.innerWidth` in an
 * effect renders the wrong thing and then corrects itself.
 *
 * Ad density is controlled by how many slots each page declares — see the slot
 * lists in the page shells — not by a runtime cap, so what renders is
 * predictable and reviewable in the code.
 */
export function getPlacementDeviceClass(placement: string) {
  switch (getPlacementDevice(placement)) {
    case "desktop":
      // Leaderboards and billboards are illegible once scaled to phone width.
      return "hidden md:block";
    case "mobile":
      return "md:hidden";
    default:
      return "";
  }
}
