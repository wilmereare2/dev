import re
import urllib.request

url = "https://manuelax.com/"
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0",
        "RSC": "1",
        "Next-Router-State-Tree": "%5B%22%22%2C%7B%22children%22%3A%5B%22(site)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
    },
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    body = resp.read().decode("utf-8", errors="ignore")
    print("status ok, len", len(body))
    for pat in ["Every Moment", "every-moment", "_id", "46K", "publishedAt"]:
        print(pat, pat in body)
    idx = body.find("Every Moment")
    if idx >= 0:
        print(body[idx - 200 : idx + 300])
    # find all sanity-like ids
    ids = set(re.findall(r'"_id":"([a-zA-Z0-9-]+)"', body))
    print("ids sample", list(ids)[:10])
except Exception as e:
    print("error", e)
