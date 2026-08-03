import type { NavItem } from "@/types";
import { MAIN_NAV } from "@/lib/constants";

/** Nav labels with optional coming-soon badges before catalog content exists. */
export function buildMainNav(contentReady: boolean): NavItem[] {
  return MAIN_NAV.map((item) => ({
    ...item,
    comingSoon: !contentReady && item.href !== "/explore",
  }));
}
