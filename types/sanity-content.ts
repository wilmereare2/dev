import type { SanityImageSource } from "@sanity/image-url";
import type { SanitySeoFields } from "@/lib/sanity/seo-metadata";

export type SanityContentCard = {
  _id: string;
  title: string;
  slug: string;
  synopsis?: string;
  durationSeconds?: number;
  featured?: boolean;
  thumbnail?: SanityImageSource;
  publishedAt?: string;
  creators?: string[];
};

export type SanityCategoryCard = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: SanityImageSource;
};

export type SanityCreatorCard = {
  _id: string;
  name: string;
  slug: string;
  avatar?: SanityImageSource;
};

export type SanityHomeSettings = {
  title?: string;
  tagline?: string;
  homepageHeroTitle?: string;
  homepageHeroSubtitle?: string;
  ageGateText?: string;
  seo?: SanitySeoFields;
};

export type SanityHomePayload = {
  settings: SanityHomeSettings | null;
  featured: SanityContentCard | null;
  latest: SanityContentCard[];
  trending: SanityContentCard[];
  categories: SanityCategoryCard[];
  creators: SanityCreatorCard[];
};
