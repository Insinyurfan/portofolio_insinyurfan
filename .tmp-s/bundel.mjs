import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);
await p.goto(`${B}/admin/proyek`, { waitUntil: "networkidle" });
const m = await p.evaluate(() => {
  const r = performance.getEntriesByType("resource");
  const js = r.filter((x) => x.initiatorType === "script" || x.name.endsWith(".js"));
  const enc = (a) => a.reduce((s, x) => s + (x.encodedBodySize || 0), 0);
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    jsBerkas: js.length,
    jsTerkirimKB: Math.round(enc(js) / 1024),
    jsTerdekompresiKB: Math.round(js.reduce((s, x) => s + (x.decodedBodySize || 0), 0) / 1024),
    domInteractive: Math.round(nav.domInteractive),
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
    muatSelesai: Math.round(nav.loadEventEnd),
  };
});
console.log(JSON.stringify(m, null, 2));
await b.close();
