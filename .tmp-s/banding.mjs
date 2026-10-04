import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);

console.log("— MUAT PENUH (goto): server + unduh + render —");
for (const h of ["/admin/keahlian", "/admin/pesan", "/admin/proyek"]) {
  const t0 = Date.now();
  const resp = await p.goto(`${B}${h}`, { waitUntil: "domcontentloaded" });
  const ttfbServer = (await p.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    return Math.round(n.responseStart - n.requestStart);
  }));
  console.log(`  ${h.padEnd(20)} total ${String(Date.now() - t0).padStart(5)} ms  TTFB server ${String(ttfbServer).padStart(5)} ms  HTTP ${resp.status()}`);
}

console.log("\n— NAVIGASI KLIEN (klik sidebar) —");
await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2000);
for (const [h, j] of [["/admin/keahlian","Keahlian"],["/admin/pesan","Pesan"],["/admin/proyek","Proyek"]]) {
  const t0 = Date.now();
  await p.click(`a[href="${h}"]`);
  await p.waitForFunction((x) => document.querySelector("h1,h2")?.textContent?.trim().startsWith(x), j, { timeout: 30000 });
  console.log(`  ${h.padEnd(20)} total ${String(Date.now() - t0).padStart(5)} ms`);
}
await b.close();
