import { createClient, type ClientConfig } from "next-sanity";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
  sanityConfigured,
} from "./env";

const baseConfig: ClientConfig = {
  projectId: sanityProjectId!,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  /** Direct API in dev avoids intermittent CDN fetch failures on some networks. */
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
  stega: { enabled: false },
};

function buildSanityClient() {
  if (!sanityConfigured) return null;
  try {
    return createClient(baseConfig);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[sanity] Failed to initialize client:", error);
    }
    return null;
  }
}

export const sanityClient = buildSanityClient();

/**
 * Runs a Sanity fetch without throwing — returns fallback when offline or blocked.
 */
export async function safeSanityFetch<T>(label: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch {
    if (process.env.NODE_ENV === "development") {
      // Avoid logging Error objects — Next.js dev overlay treats them as runtime crashes.
      console.warn(`[sanity] ${label} unavailable — using fallback UI. Check network / project id.`);
    }
    return fallback;
  }
}
