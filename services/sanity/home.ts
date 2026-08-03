import { cache } from "react";
import { sanityClient, safeSanityFetch } from "@/lib/sanity/client";
import type { SanityHomePayload } from "@/types/sanity-content";
import { HOME_PAGE_QUERY } from "@/services/sanity/queries";

const emptyHome: SanityHomePayload = {
  settings: null,
  featured: null,
  latest: [],
  trending: [],
  categories: [],
  creators: [],
};

export const fetchHomePageData = cache(async (): Promise<SanityHomePayload> => {
  const client = sanityClient;
  if (!client) return emptyHome;

  return safeSanityFetch(
    "home",
    () => client.fetch<SanityHomePayload>(HOME_PAGE_QUERY, {}, { next: { revalidate: 60 } }),
    emptyHome,
  );
});
