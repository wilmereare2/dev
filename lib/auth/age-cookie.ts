export const AGE_VERIFIED_COOKIE = "mx-age-verified";

export const AGE_COOKIE_30_DAYS = 60 * 60 * 24 * 30;
export const AGE_COOKIE_365_DAYS = 60 * 60 * 24 * 365;

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-only-change-me-manuelax-phase1-secret";
}

function parsePayload(value: string) {
  const lastDot = value.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = value.slice(0, lastDot);
  const signature = value.slice(lastDot + 1);
  const parts = payload.split(".");
  if (parts.length !== 2 || parts[0] !== "1") return null;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { payload, signature, maxAge: expiresAt - Math.floor(Date.now() / 1000) };
}

async function hmacSha256Base64Url(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function isAgeVerifiedCookie(value: string | undefined) {
  if (!value) return false;

  const parsed = parsePayload(value);
  if (!parsed) return false;

  const expected = await hmacSha256Base64Url(parsed.payload, getSecret());
  return expected === parsed.signature;
}

export async function createAgeVerifiedCookie(rememberDevice: boolean) {
  const maxAge = rememberDevice ? AGE_COOKIE_365_DAYS : AGE_COOKIE_30_DAYS;
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `1.${expiresAt}`;
  const signature = await hmacSha256Base64Url(payload, getSecret());
  return { value: `${payload}.${signature}`, maxAge };
}

export function ageVerifiedCookieOptions(maxAge: number, secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

export function clearAgeVerifiedCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 0,
  };
}
