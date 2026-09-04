/**
 * Third-party ad network creatives.
 *
 * Network tags (ExoClick, TrafficJunky, JuicyAds, ...) are arbitrary
 * third-party JavaScript. Injecting them into the main document would let them
 * block the main thread, `document.write`, read cookies and storage, and mutate
 * the page. They are therefore rendered inside a sandboxed iframe pointing at
 * `/api/ads/frame/<id>`, so the script executes in its own origin-less document
 * and cannot reach the site around it.
 */

export const AD_CREATIVE_TYPES = ["direct", "script", "iframe"] as const;
export type AdCreativeType = (typeof AD_CREATIVE_TYPES)[number];

/** Networks the admin form offers. Free text is still allowed. */
export const AD_NETWORKS = [
  "ExoClick",
  "TrafficJunky",
  "JuicyAds",
  "TrafficStars",
  "Adsterra",
  "ClickAdilla",
  "CrakRevenue",
  "Other",
] as const;

export function isAdCreativeType(value: string): value is AdCreativeType {
  return (AD_CREATIVE_TYPES as readonly string[]).includes(value);
}

export function parseAdCreativeType(value?: string | null): AdCreativeType {
  return value && isAdCreativeType(value) ? value : "direct";
}

/** Creative types whose markup runs inside the sandboxed frame. */
export function isNetworkCreative(creativeType: string) {
  return creativeType === "script" || creativeType === "iframe";
}

export function adFramePath(id: string) {
  return `/api/ads/frame/${id}`;
}

const MAX_EMBED_CODE_LENGTH = 20_000;

/**
 * Validates a pasted network tag.
 *
 * The tag is not sanitised into something "safe" — it is third-party script by
 * definition and is isolated by the sandboxed frame instead. What is checked is
 * that it is a plausible tag of bounded size, so a mis-paste fails at save time
 * rather than silently rendering an empty slot.
 */
export function validateEmbedCode(raw?: string | null) {
  const code = raw?.trim();
  if (!code) return { ok: false as const, error: "Paste the network's ad tag." };
  if (code.length > MAX_EMBED_CODE_LENGTH) {
    return { ok: false as const, error: "Ad tag is too large (20,000 characters max)." };
  }
  if (!/<script|<ins|<iframe|<div|<a\s|<img/i.test(code)) {
    return { ok: false as const, error: "That does not look like an ad tag. Paste the network's HTML snippet." };
  }
  return { ok: true as const, code };
}

export function validateIframeUrl(raw?: string | null) {
  const value = raw?.trim();
  if (!value) return { ok: false as const, error: "Enter the network's iframe URL." };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false as const, error: "Enter a valid URL (include https://)." };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false as const, error: "Iframe URLs must use https." };
  }
  return { ok: true as const, url: parsed.toString() };
}
