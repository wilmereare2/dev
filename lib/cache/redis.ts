type CacheEntry = { value: string; expiresAt: number };

const memory = new Map<string, CacheEntry>();

export async function cacheGet(key: string) {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const response = await fetch(`${redisUrl.replace(/\/$/, "")}/get/${encodeURIComponent(key)}`);
      if (response.ok) {
        const data = (await response.json()) as { value?: string };
        return data.value ?? null;
      }
    } catch {
      /* fall through to memory */
    }
  }

  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300) {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      await fetch(`${redisUrl.replace(/\/$/, "")}/set/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, ttl: ttlSeconds }),
      });
      return;
    } catch {
      /* fall through to memory */
    }
  }

  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
