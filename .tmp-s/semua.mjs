import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);

const semua = [];
p.on("requestfinished", (req) => {
  const t = req.timing();
  semua.push({ u: req.url().replace(B, "").split("?")[0].slice(0, 48), tipe: req.resourceType(),
               ttfb: Math.round(t.responseStart - t.requestStart) });
});

await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2500);

for (const [href, judul] of [["/admin/keahlian","Keahlian"],["/admin/pesan","Pesan"]]) {
  semua.length = 0;
  const t0 = Date.now();
  await p.click(`a[href="${href}"]`);
  await p.waitForFunction((j) => document.querySelector("h1,h2")?.textContent?.trim().startsWith(j), judul, { timeout: 30000 });
  const terlihat = Date.now() - t0;
  await p.waitForTimeout(600);
  console.log(`\n${href} — terlihat ${terlihat} ms, ${semua.length} permintaan:`);
  for (const r of semua) console.log(`   ${String(r.ttfb).padStart(5)} ms  ${r.tipe.padEnd(9)} ${r.u}`);
}
await b.close();
