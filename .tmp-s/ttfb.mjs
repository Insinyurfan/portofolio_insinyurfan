import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);

const log = [];
p.on("requestfinished", (req) => {
  if (!req.url().includes("_rsc=")) return;
  const t = req.timing();
  log.push({
    url: req.url().replace(B, "").split("?")[0],
    dns: Math.round(t.domainLookupEnd - t.domainLookupStart),
    connect: Math.round(t.connectEnd - t.connectStart),
    ttfb: Math.round(t.responseStart - t.requestStart),
    unduh: Math.round(t.responseEnd - t.responseStart),
  });
});

await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2000);

for (const [href, judul] of [["/admin/keahlian","Keahlian"],["/admin/proyek","Proyek"],["/admin/pesan","Pesan"]]) {
  log.length = 0;
  const t0 = Date.now();
  await p.click(`a[href="${href}"]`);
  await p.waitForFunction((j) => document.querySelector("h1,h2")?.textContent?.trim().startsWith(j), judul, { timeout: 30000 });
  const terlihat = Date.now() - t0;
  await p.waitForTimeout(400);
  const d = log[0];
  console.log(`${href.padEnd(18)} terlihat ${String(terlihat).padStart(5)} ms  |  TTFB server ${String(d?.ttfb ?? -1).padStart(5)} ms  unduh ${d?.unduh ?? -1} ms  connect ${d?.connect ?? -1} ms`);
}
await b.close();
