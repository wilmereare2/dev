import re
import json
import urllib.request
from datetime import datetime, timezone

def estimate_content_views(id: str, published_at: str | None = None) -> int:
    hash_val = 0
    for i in range(len(id)):
        hash_val = (hash_val * 31 + ord(id[i])) & 0xFFFFFFFF

    age_boost = 0
    if published_at:
        try:
            dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            age_ms = (datetime.now(timezone.utc) - dt).total_seconds() * 1000
            age_boost = min(40_000, int(age_ms / (1000 * 60 * 60 * 6)))
        except Exception:
            pass

    return 2400 + (hash_val % 48000) + age_boost

def format_compact(value: int) -> str:
    if value < 1000:
        return str(value)
    if value < 1_000_000:
        compact = value / 1000
        if compact >= 10:
            return f"{round(compact)}K"
        s = f"{compact:.1f}".rstrip("0").rstrip(".")
        return f"{s}K"
    compact = value / 1_000_000
    if compact >= 10:
        return f"{round(compact)}M"
    s = f"{compact:.1f}".rstrip("0").rstrip(".")
    return f"{s}M"

for url in [
    "https://manuelax.com/content/every-moment-has-a-story",
    "https://manuelax.com/",
]:
    print("===", url, "===")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="ignore")
    print("html length", len(html))

    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if match:
        data = json.loads(match.group(1))
        blob = json.dumps(data)
        ids = re.findall(r'"_id"\s*:\s*"(content[^"]+)"', blob)
        print("content ids found:", ids[:5])
        if '"Every Moment Has a Story"' in blob or 'every-moment-has-a-story' in blob:
            # extract object around title
            idx = blob.find("Every Moment Has a Story")
            snippet = blob[max(0, idx - 500): idx + 200]
            id_m = re.search(r'"_id"\s*:\s*"([^"]+)"', snippet)
            pub_m = re.search(r'"publishedAt"\s*:\s*"([^"]+)"', snippet)
            if id_m:
                cid = id_m.group(1)
                pub = pub_m.group(1) if pub_m else None
                views = estimate_content_views(cid, pub)
                print("title match _id:", cid)
                print("publishedAt:", pub)
                print("exact_views:", views)
                print("displayed:", format_compact(views))

    # RSC flight data sometimes embeds content
    for m in re.finditer(r'\{"_id":"([^"]+)".{0,800}?"slug":"every-moment-has-a-story"', html):
        cid = m.group(1)
        pub_m = re.search(r'"publishedAt":"([^"]+)"', m.group(0))
        pub = pub_m.group(1) if pub_m else None
        views = estimate_content_views(cid, pub)
        print("RSC match _id:", cid, "views:", views, format_compact(views))

    if "46K" in html or "46k" in html.lower():
        print("46K found in html")

print("\nDemo with sample sanity id patterns:")
for sample_id in [
    "content-every-moment-has-a-story",
    "drafts.content-every-moment-has-a-story",
    "abc123",
]:
    v = estimate_content_views(sample_id)
    print(sample_id, v, format_compact(v))
