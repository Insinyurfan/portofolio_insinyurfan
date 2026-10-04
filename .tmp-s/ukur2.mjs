import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);

let jumlahRsc = 0;
p.on("response", (r) => { if (r.url().includes("_rsc=")) jumlahRsc += 1; });

const pasangan = [["/admin/proyek","Proyek"],["/admin/keahlian","Keahlian"],
  ["/admin/pengalaman","Pengalaman"],["/admin/pendidikan","Pendidikan"],
  ["/admin/pencapaian","Pencapaian"],["/admin/tautan-sosial","Tautan Sosial"],
  ["/admin/pesan","Pesan"],["/admin/rating","Rating"],["/admin/profil","Profil"]];

await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2000);
jumlahRsc = 0;

let total = 0;
for (const [href, judul] of pasangan) {
  const t0 = Date.now();
  await p.click(`a[href="${href}"]`);
  await p.waitForFunction((j) => document.querySelector("h1,h2")?.textContent?.trim().startsWith(j), judul, { timeout: 30000 });
  const ms = Date.now() - t0;
  total += ms;
  console.log(`  ${href.padEnd(22)} ${String(ms).padStart(5)} ms`);
}
console.log(`  rata-rata: ${Math.round(total / pasangan.length)} ms`);
console.log(`  permintaan RSC total: ${jumlahRsc} (sebelumnya ~8 per kunjungan hanya untuk prefetch)`);
await b.close();
