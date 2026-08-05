import type { NavItem } from "@/types";

export const APP_NAME = "manuelaX";
export const APP_TAGLINE =
  "Premium 18+ creator platform — exclusive profiles, cinematic releases, curated discovery.";

export const EMPTY_HERO = {
  title: "Discover exclusive creators.",
  subtitle:
    "Premium creator content is coming soon. New creators are joining every week — follow launches, spotlights, and first releases here.",
} as const;

export const MAIN_NAV: NavItem[] = [
  { href: "/explore", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/trending", label: "Trending" },
  { href: "/newest", label: "Newest" },
  { href: "/library", label: "Library" },
  { href: "/pricing", label: "Pricing" },
];

export const SOCIAL_LINKS = [
  { href: "https://x.com", label: "X" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://discord.com", label: "Discord" },
] as const;

export const PAYMENT_BADGES = ["Visa", "Mastercard", "Amex", "SSL Secure"] as const;

export const FOOTER_LINKS = {
  discover: [
    { href: "/explore", label: "Explore" },
    { href: "/categories", label: "Categories" },
    { href: "/tags", label: "Tags" },
    { href: "/trending", label: "Trending" },
    { href: "/popular", label: "Popular" },
    { href: "/pricing", label: "Pricing" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
    { href: "/settings/profile", label: "Settings" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/dmca", label: "DMCA" },
  ],
} as const;
