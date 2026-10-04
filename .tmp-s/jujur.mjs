import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);
await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2500);

// Diukur DARI DALAM halaman memakai MutationObserver, supaya tidak terpengaruh
// jeda polling Playwright maupun perjalanan pesan antarproses.
for (const [href, judul] of [["/admin/keahlian","Keahlian"],["/admin/pesan","Pesan"],["/admin/proyek","Proyek"]]) {
  const hasil = await p.evaluate(async ({ href, judul }) => {
    const mulai = performance.now();
    const selesai = new Promise((res) => {
      const obs = new MutationObserver(() => {
        const h = document.querySelector("h1,h2")?.textContent?.trim() ?? "";
        if (h.startsWith(judul)) { obs.disconnect(); res(performance.now() - mulai); }
      });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    document.querySelector(`a[href="${href}"]`).click();
    return Math.round(await selesai);
  }, { href, judul });
  console.log(`  ${href.padEnd(20)} ${String(hasil).padStart(5)} ms (diukur di dalam halaman)`);
  await p.waitForTimeout(600);
}
await b.close();
