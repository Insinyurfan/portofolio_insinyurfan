import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);

const log = [];
p.on("requestfinished", (req) => {
  const h = req.headers();
  const adalahRsc = h["rsc"] !== undefined || h["next-router-state-tree"] !== undefined;
  if (!adalahRsc && req.resourceType() !== "document") return;
  const t = req.timing();
  log.push({
    url: req.url().replace(B, "").split("?")[0],
    ttfb: Math.round(t.responseStart - t.requestStart),
    unduh: Math.round(t.responseEnd - t.responseStart),
  });
});

await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2000);

for (const [href, judul] of [["/admin/keahlian","Keahlian"],["/admin/proyek","Proyek"],["/admin/pesan","Pesan"],["/admin/rating","Rating"]]) {
  log.length = 0;
  const t0 = Date.now();
  await p.click(`a[href="${href}"]`);
  await p.waitForFunction((j) => document.querySelector("h1,h2")?.textContent?.trim().startsWith(j), judul, { timeout: 30000 });
  const terlihat = Date.now() - t0;
  await p.waitForTimeout(400);
  const d = log.find((x) => x.url === href) ?? log[0];
  console.log(`${href.padEnd(18)} terlihat ${String(terlihat).padStart(5)} ms  |  TTFB ${String(d?.ttfb ?? -1).padStart(5)} ms  unduh ${String(d?.unduh ?? -1).padStart(4)} ms  (${log.length} permintaan)`);
}
await b.close();
