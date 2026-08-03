import type { Metadata } from "next";
import { HomeView } from "@/features/home/home-view";
import { fetchHomePageData } from "@/services/sanity/home";
import { metadataFromSanitySeo } from "@/lib/sanity/seo-metadata";
import { APP_NAME, APP_TAGLINE, EMPTY_HERO } from "@/lib/constants";

const DEFAULT_HERO = {
  heroTitle: "Uncensored premium experiences.",
  heroSubtitle:
    "Creator-led catalog with cinematic playback — browse categories, trending picks, and exclusive releases.",
  emptyHeroTitle: EMPTY_HERO.title,
  emptyHeroSubtitle: EMPTY_HERO.subtitle,
};

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await fetchHomePageData();
  return metadataFromSanitySeo(settings?.seo, {
    title: settings?.title || APP_NAME,
    description: settings?.tagline || APP_TAGLINE,
  });
}

export default async function HomePage() {
  const data = await fetchHomePageData();
  return <HomeView data={data} defaults={DEFAULT_HERO} />;
}
