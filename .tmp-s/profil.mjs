import { chromium } from "file:///D:/portofolio/node_modules/playwright/index.mjs";
import { masukSebagaiAdmin } from "file:///D:/portofolio/e2e/helpers.mjs";
const B = "https://portofolio-insinyurfan.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await masukSebagaiAdmin(p, B);
await p.goto(`${B}/admin`, { waitUntil: "load" });
await p.waitForTimeout(2500);

const hasil = await p.evaluate(async () => {
  const tugas = [];
  const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) tugas.push(Math.round(e.duration)); });
  try { po.observe({ entryTypes: ["longtask"] }); } catch {}

  const n0 = performance.getEntriesByType("resource").length;
  const mulai = performance.now();
  const selesai = new Promise((res) => {
    const obs = new MutationObserver(() => {
      if ((document.querySelector("h1,h2")?.textContent ?? "").trim().startsWith("Keahlian")) {
        obs.disconnect(); res(performance.now() - mulai);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  document.querySelector('a[href="/admin/keahlian"]').click();
  const total = Math.round(await selesai);
  await new Promise((r) => setTimeout(r, 400));
  po.disconnect();

  const baru = performance.getEntriesByType("resource").slice(n0).map((r) => ({
    u: r.name.split("/").pop().slice(0, 34),
    dur: Math.round(r.duration),
    tipe: r.initiatorType,
  }));
  return { total, tugasPanjang: tugas, totalTugas: tugas.reduce((a, c) => a + c, 0), permintaanBaru: baru };
});
console.log(JSON.stringify(hasil, null, 1));
await b.close();
