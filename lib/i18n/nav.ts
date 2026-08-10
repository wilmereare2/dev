import type { MessageKey } from "@/lib/i18n/messages";

export const NAV_PATH_KEYS: Record<string, MessageKey> = {
  "/": "nav.home",
  "/messages": "nav.messages",
  "/explore": "nav.explore",
  "/categories": "nav.categories",
  "/promotions": "nav.promotions",
  "/trending": "nav.trending",
  "/newest": "nav.newest",
  "/library": "nav.library",
  "/create": "nav.create",
  "/pricing": "nav.pricing",
  "/popular": "nav.popular",
  "/tags": "nav.tags",
  "/about": "nav.about",
  "/contact": "nav.contact",
  "/faq": "nav.faq",
  "/settings/profile": "nav.settings",
  "/privacy": "nav.privacy",
  "/terms": "nav.terms",
  "/dmca": "nav.dmca",
};

export function navMessageKey(href: string): MessageKey | undefined {
  return NAV_PATH_KEYS[href];
}
