/** Missing project id is allowed so the app boots before Sanity credentials exist. */
export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();

export const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";

const DEFAULT_SANITY_API_VERSION = "2025-01-01";

/** Sanity accepts `1` or a date string `YYYY-MM-DD`. */
export function resolveSanityApiVersion(raw?: string) {
  const value = raw?.trim().replace(/^["']|["']$/g, "");
  if (!value) return DEFAULT_SANITY_API_VERSION;
  if (value === "1") return "1";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return DEFAULT_SANITY_API_VERSION;
}

export const sanityApiVersion = resolveSanityApiVersion(process.env.NEXT_PUBLIC_SANITY_API_VERSION);

export const sanityConfigured = Boolean(sanityProjectId && sanityProjectId.length > 0);
