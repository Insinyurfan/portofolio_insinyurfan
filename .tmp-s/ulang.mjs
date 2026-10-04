import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);
await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(1500);

// Permintaan RSC yang sama, berulang-ulang, langsung dari dalam halaman.
const hasil = await p.evaluate(async () => {
  const waktu = [];
  for (let i = 0; i < 6; i += 1) {
    const t0 = performance.now();
    await fetch("/admin/keahlian?_rsc=uji" + i, { headers: { RSC: "1" } });
    waktu.push(Math.round(performance.now() - t0));
  }
  // Pembanding: halaman publik statis lewat jalur yang sama.
  const publik = [];
  for (let i = 0; i < 3; i += 1) {
    const t0 = performance.now();
    await fetch("/kontak?_rsc=uji" + i, { headers: { RSC: "1" } });
    publik.push(Math.round(performance.now() - t0));
  }
  return { admin: waktu, publik };
});
console.log("admin /keahlian (6x berturut) :", hasil.admin.join(", "), "ms");
console.log("publik /kontak  (3x berturut) :", hasil.publik.join(", "), "ms");
await b.close();
