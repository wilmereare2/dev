/**
 * Responsive regression check.
 *
 * Drives a headless Chrome over the CDP and reports any element whose content
 * is wider than its own box — the failure that produces clipped headings and
 * horizontal scroll. `body { overflow-x: hidden }` in globals.css hides this
 * class of bug visually, so it has to be measured rather than eyeballed.
 *
 * Usage:
 *   1. RATE_LIMIT_GLOBAL_MAX=100000 npx next start --port 3666
 *   2. chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<tmp> about:blank
 *   3. node scripts/check-responsive.mjs [baseUrl] [cdpPort]
 *
 * Exits non-zero when overflow is found, so it can gate a deploy.
 */
const BASE = process.argv[2] || "http://localhost:3666";
const CDP_PORT = process.argv[3] || "9222";

const WIDTHS = [320, 390, 414, 768, 1024, 1280, 1440];
const PAGES = [
  "/", "/explore", "/trending", "/newest", "/popular", "/categories", "/tags",
  "/pricing", "/about", "/faq", "/contact", "/privacy", "/terms", "/dmca",
  "/search", "/library", "/promotions", "/subscriptions", "/referrals",
  "/settings", "/settings/profile", "/settings/security", "/settings/privacy",
  "/account", "/account/forgot-password", "/notifications", "/create",
];

/** Minimum DOM nodes for a response to count as a real rendered page. */
const MIN_NODES = 50;

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const target = targets.find((t) => t.type === "page");
if (!target) {
  console.error("No CDP page target. Is Chrome running with --remote-debugging-port?");
  process.exit(2);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
await new Promise((resolve) => ws.addEventListener("open", resolve));

/** Every call is bounded — a dropped CDP reply must not hang the run. */
const send = (method, params = {}, timeoutMs = 20000) =>
  new Promise((resolve) => {
    const i = ++id;
    const timer = setTimeout(() => {
      if (pending.delete(i)) resolve({ __timeout: true, method });
    }, timeoutMs);
    pending.set(i, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    ws.send(JSON.stringify({ id: i, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

const goto = async (url, wait = 2200) => {
  const nav = await send("Page.navigate", { url });
  if (nav?.__timeout) console.log(`  (navigation timed out: ${url})`);
  await new Promise((r) => setTimeout(r, wait));
};

await send("Page.enable");
await send("Runtime.enable");

// Clear the age gate so gated routes render instead of redirecting.
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await goto(`${BASE}/verify-age`, 3000);
await evaluate(`fetch("/api/compliance/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ dateOfBirth: "1990-01-01", acceptTerms: true, acceptPrivacy: true, rememberDevice: true }),
}).then((r) => r.status)`);

await goto(`${BASE}/library`, 3000);
const gateNodes = await evaluate("document.querySelectorAll('*').length");
if (gateNodes < MIN_NODES) {
  console.error(`Age gate not cleared (only ${gateNodes} nodes) — results would be meaningless.`);
  ws.close();
  process.exit(2);
}

const DETECT = `(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.overflowX !== "visible") continue;               // scrolls on purpose
    if (cs.position === "fixed" || cs.position === "absolute") continue; // decorative
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      bad.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute("class") || "").slice(0, 80),
        by: el.scrollWidth - el.clientWidth,
        text: (el.textContent || "").trim().slice(0, 40),
      });
    }
  }
  bad.sort((a, b) => b.by - a.by);
  return JSON.stringify({ vw, doc: document.documentElement.scrollWidth, count: bad.length, worst: bad.slice(0, 3) });
})()`;

let measured = 0;
let skipped = 0;
const findings = [];

for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  process.stdout.write(`
width ${width}: `);
  for (const path of PAGES) {
    await goto(BASE + path);
    await new Promise((r) => setTimeout(r, 400));

    process.stdout.write(".");
    const nodes = await evaluate("document.querySelectorAll('*').length");
    if (!nodes || nodes < MIN_NODES) {
      skipped += 1;
      console.log(`${String(width).padStart(4)}  ${path.padEnd(26)} SKIPPED (${nodes ?? 0} nodes)`);
      continue;
    }

    const raw = await evaluate(DETECT);
    if (!raw) { skipped += 1; continue; }
    const r = JSON.parse(raw);
    measured += 1;

    const scrolls = r.doc > r.vw + 2;
    if (r.count > 0 || scrolls) {
      findings.push({ width, path, ...r });
      console.log(`${String(width).padStart(4)}  ${path.padEnd(26)} offenders=${r.count}${scrolls ? " PAGE-SCROLLS" : ""}`);
      for (const w of r.worst) console.log(`        +${w.by}px <${w.tag}> "${w.text}" ${w.cls}`);
    }
  }
}

console.log(`\nmeasured ${measured} page/width combinations (${skipped} skipped)`);
console.log(findings.length ? `FAIL: ${findings.length} with overflow` : "PASS: no overflow found");
ws.close();
process.exit(findings.length ? 1 : 0);
