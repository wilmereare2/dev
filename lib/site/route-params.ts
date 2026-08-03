/** Decode dynamic route segments that may still contain %20, %27, etc. */
export function decodeRouteParam(value: string): string {
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded.normalize("NFC");
}

/** URL-safe slug for hrefs — handles spaces, apostrophes, unicode. */
export function encodeRouteParam(value: string): string {
  return encodeURIComponent(value.normalize("NFC"));
}
