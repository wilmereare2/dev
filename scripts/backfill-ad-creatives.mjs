/**
 * Moves legacy inline `data:` ad banners into the AdCreative table and rewrites
 * the Advertisement rows to reference them by path.
 *
 * Safe to re-run: rows already using /api/ads/creative/ are skipped, and
 * creatives are de-duplicated by checksum.
 *
 * Usage: node scripts/backfill-ad-creatives.mjs [--dry-run]
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");
// Scripts run outside the app, so keep a tiny pool to avoid competing with it.
function scriptDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  url.searchParams.set("connection_limit", "2");
  url.searchParams.set("pool_timeout", "30");
  return url.toString();
}

const prisma = new PrismaClient({
  datasources: { db: { url: scriptDatabaseUrl() } },
});

const FIELDS = ["imageUrl", "imageUrlTablet", "imageUrlMobile"];

function parseDataUrl(value) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  const [, mimeType, base64] = match;
  try {
    return { mimeType, buffer: Buffer.from(base64, "base64") };
  } catch {
    return null;
  }
}

async function storeCreative(mimeType, buffer) {
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const existing = await prisma.adCreative.findUnique({
    where: { checksum },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.adCreative.create({
    data: { mimeType, byteSize: buffer.length, checksum, data: buffer },
    select: { id: true },
  });
  return created.id;
}

const ads = await prisma.advertisement.findMany({
  select: { id: true, title: true, imageUrl: true, imageUrlTablet: true, imageUrlMobile: true },
});

let convertedFields = 0;
let bytesInlined = 0;

for (const ad of ads) {
  const updates = {};

  for (const field of FIELDS) {
    const value = ad[field];
    if (!value || !value.startsWith("data:")) continue;

    const parsed = parseDataUrl(value);
    if (!parsed) {
      console.warn(`  ! ${ad.title} ${field}: unparseable data URL, leaving as-is`);
      continue;
    }

    bytesInlined += value.length;
    if (dryRun) {
      console.log(
        `  would convert ${ad.title} ${field} (${(value.length / 1024).toFixed(0)}KB inline -> creative)`,
      );
      convertedFields += 1;
      continue;
    }

    const id = await storeCreative(parsed.mimeType, parsed.buffer);
    updates[field] = `/api/ads/creative/${id}`;
    convertedFields += 1;
    console.log(`  ${ad.title} ${field} -> /api/ads/creative/${id}`);
  }

  if (!dryRun && Object.keys(updates).length) {
    await prisma.advertisement.update({ where: { id: ad.id }, data: updates });
  }
}

console.log(
  `\n${dryRun ? "[dry run] " : ""}ads scanned: ${ads.length}, banners converted: ${convertedFields}, inline payload removed: ${(bytesInlined / 1024).toFixed(0)}KB`,
);

await prisma.$disconnect();
