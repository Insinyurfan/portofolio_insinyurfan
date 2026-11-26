/**
 * Verifikasi halaman publik lewat browser: 320px dan layar lebar, tema terang
 * dan gelap, hanya keyboard, dan dengan reduced motion aktif.
 *
 * Menutup task 9.4 change setup-portfolio-public-site.
 */

import { chromium } from "playwright";

const PORT = process.argv[2] ?? "3020";
const BASE = `http://localhost:${PORT}`;

const HALAMAN = [
  "/",
  "/tentang",
  "/pendidikan",
  "/keahlian",
  "/pengalaman",
  "/proyek",
  "/sertifikat",
  "/kontak",
];

let gagal = 0;
const cek = (n, l, c = "") => {
  console.log(`  ${l ? "LULUS" : "GAGAL"}  ${n}${c ? ` — ${c}` : ""}`);
  if (!l) gagal += 1;
};

const browser = await chromium.launch();

try {
  // ============================================ 320px & layar lebar
  for (const [label, viewport] of [
    ["320px", { width: 320, height: 720 }],
    ["1280px", { width: 1280, height: 900 }],
  ]) {
    console.log(`\n— Lebar ${label} —`);
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e)));

    await page.goto(`${BASE}/proyek`, { waitUntil: "domcontentloaded" });
    const kartuProyek = page.locator("main article a[aria-haspopup=dialog]").first();
    const detailProyek = (await kartuProyek.count()) ? await kartuProyek.getAttribute("href") : null;
    const halaman = detailProyek ? [...HALAMAN, detailProyek] : HALAMAN;

    for (const path of halaman) {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: "load" });
      await page.waitForTimeout(250);

      const scrollH = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );

      // Satu h1 per halaman, hierarki heading tidak melompat.
      const h1 = await page.locator("h1").count();

      // Tidak ada gambar rusak.
      const rusak = await page.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0)
          .length,
      );

      cek(
        `${path}`,
        res?.status() === 200 && !scrollH && h1 === 1 && rusak === 0,
        `HTTP ${res?.status()} · scrollH=${scrollH} · h1=${h1} · gambar rusak=${rusak}`,
      );
    }

    cek(
      `tidak ada error runtime di ${label}`,
      errs.length === 0,
      errs.slice(0, 1).join("").slice(0, 90),
    );
    await ctx.close();
  }

  // ============================================ Tema gelap
  console.log("\n— Tema gelap —");
  {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(900);

    const gelapAktif = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    cek("preferensi sistem gelap diikuti", gelapAktif);

    const latar = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    cek("latar body ikut gelap", latar !== "rgb(246, 249, 247)", latar);

    // Toggle ke terang, lalu pastikan pilihannya bertahan setelah muat ulang.
    await page.getByRole("button", { name: "Aktifkan tema terang" }).click();
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(900);
    const masihTerang = await page.evaluate(
      () => !document.documentElement.classList.contains("dark"),
    );
    cek("pilihan tema bertahan setelah muat ulang", masihTerang);
    await ctx.close();
  }

  // ============================================ Hanya keyboard
  console.log("\n— Hanya keyboard —");
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(400);

    await page.keyboard.press("Tab");
    const pertama = await page.evaluate(
      () => (document.activeElement?.textContent ?? "").trim(),
    );
    cek(
      "Tab pertama memfokuskan tautan lompat ke konten",
      pertama.includes("Lompat ke konten utama"),
      pertama.slice(0, 40),
    );

    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    cek("tautan lompat berfungsi", page.url().includes("#konten-utama"));

    // Detail proyek bisa dibuka dan ditutup tanpa meninggalkan daftar.
    await page.goto(`${BASE}/proyek`, { waitUntil: "load" });
    cek("daftar proyek tanpa filter teknologi", await page.locator('main a[href^="/proyek/tech/"]').count() === 0);
    const proyek = page.locator("main article a[aria-haspopup=dialog]").first();
    if (await proyek.count()) {
      await proyek.press("Enter");
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 15000 });
      cek("detail proyek terbuka tanpa meninggalkan daftar", new URL(page.url()).pathname === "/proyek");
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 15000 });
      cek("fokus kembali ke kartu proyek", await proyek.evaluate((el) => el === document.activeElement));
    }

    // Pratinjau sertifikat: buka dengan keyboard, tutup dengan Escape.
    await page.goto(`${BASE}/sertifikat`, { waitUntil: "load" });
    await page.waitForTimeout(500);
    await page.locator("ul > li button").first().focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    cek("pratinjau sertifikat terbuka", (await page.getByRole("dialog").count()) > 0);
    const fokusDiDialog = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.contains(document.activeElement) : false;
    });
    cek("fokus berpindah ke dalam pratinjau", fokusDiDialog);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    cek("Escape menutup pratinjau", (await page.getByRole("dialog").count()) === 0);

    // Menu mobile publik.
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    await page.waitForTimeout(500);
    cek("menu mobile terbuka", await page.locator("#menu-mobile").isVisible());
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    cek("Escape menutup menu mobile", !(await page.locator("#menu-mobile").isVisible()));
    await ctx.close();
  }

  // ============================================ Reduced motion
  console.log("\n— Reduced motion —");
  {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(900);

    // Tidak ada konten yang tertinggal tersembunyi oleh animasi reveal.
    const tersembunyi = await page.evaluate(
      () =>
        [...document.querySelectorAll("[class*='opacity-0']")].filter(
          (el) => getComputedStyle(el).opacity === "0",
        ).length,
    );
    cek("tidak ada konten tersembunyi saat reduced motion", tersembunyi === 0, `${tersembunyi} elemen`);

    // Role tampil statis dan lengkap, bukan animasi ketik.
    const teksRole = await page.locator("h1 ~ div p").first().textContent();
    cek(
      "role tampil statis dan lengkap",
      (teksRole ?? "").includes("·"),
      (teksRole ?? "").slice(0, 55),
    );
    await ctx.close();
  }

  // ============================================ Tanpa JavaScript
  console.log("\n— Tanpa JavaScript —");
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load" });

    const html = await page.content();

    /**
     * Yang diuji di sini adalah "isi database ikut terkirim di HTML awal",
     * BUKAN nilai tertentu.
     *
     * Versi sebelumnya mencari "Nama Lengkap Anda", "Penggemar Open Source",
     * dan "Sistem Informasi Perpustakaan" — semuanya data seed. Begitu pemilik
     * mengganti data contoh dengan isi aslinya, yang justru tujuan seluruh
     * dashboard ini, pemeriksaan ini mulai gagal karena alasan yang salah dan
     * menyamarkan regresi sungguhan.
     *
     * Nilai pembandingnya kini diambil dari halaman yang SAMA saat JavaScript
     * aktif. Kalau isinya hanya muncul setelah hidrasi, perbandingan ini tetap
     * gagal — dan itulah yang memang ingin ditangkap.
     */
    const dariKlien = await (async () => {
      const c = await browser.newContext();
      const pg = await c.newPage();
      await pg.goto(`${BASE}/`, { waitUntil: "load" });
      await pg.waitForTimeout(600);
      const nilai = await pg.evaluate(() => ({
        nama: document.querySelector("h1")?.textContent?.trim() ?? "",
        proyek:
          document
            .querySelector("section:last-of-type ul li h2, ul li h3")
            ?.textContent?.trim() ?? "",
      }));
      await c.close();
      return nilai;
    })();

    cek(
      "nama pemilik ada di HTML tanpa JavaScript",
      dariKlien.nama !== "" && html.includes(dariKlien.nama),
      dariKlien.nama,
    );
    cek(
      "judul proyek ada di HTML tanpa JavaScript",
      dariKlien.proyek !== "" && html.includes(dariKlien.proyek),
      dariKlien.proyek,
    );

    const tersembunyi = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter(
          (el) => getComputedStyle(el).opacity === "0",
        ).length,
    );
    cek("tidak ada konten tersembunyi tanpa JS", tersembunyi === 0, `${tersembunyi} elemen`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${gagal === 0 ? "Semua pemeriksaan LULUS." : `${gagal} pemeriksaan GAGAL.`}`);
process.exit(gagal === 0 ? 0 : 1);
