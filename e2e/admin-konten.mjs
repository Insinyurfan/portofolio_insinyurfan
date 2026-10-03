/**
 * Bagian kedua verifikasi browser: proyek & slug, unggah berkas, cascade
 * keahlian, pengalaman masih berjalan, IPK, sitemap, dan regresi publik.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { loginPath } from "./helpers.mjs";
import { bacaEnvLokal } from "../scripts/env-lokal.mjs";

const PORT = process.argv[2] ?? "3020";
const BASE = `http://localhost:${PORT}`;
// Berkas uji ditulis ke subfolder yang diabaikan git.
const TMP = fileURLToPath(new URL("./.tmp/", import.meta.url));
mkdirSync(TMP, { recursive: true });

const e = bacaEnvLokal(new URL("../.env.local", import.meta.url));

// Gambar PNG 1x1 untuk uji unggah.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);
writeFileSync(`${TMP}/uji.png`, PNG);
writeFileSync(`${TMP}/uji.txt`, "ini bukan gambar");

let gagal = 0;
const cek = (n, l, c = "") => {
  console.log(`  ${l ? "LULUS" : "GAGAL"}  ${n}${c ? ` — ${c}` : ""}`);
  if (!l) gagal += 1;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pub = await ctx.newPage();

try {
  // Login.
  await page.goto(`${BASE}${loginPath()}`, { waitUntil: "load" });
  await page.getByLabel("Email").fill(e.ADMIN_EMAIL);
  await page.getByLabel("Password").fill(e.ADMIN_TEMP_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin$/, { timeout: 25000 });

  // ================================================= PROYEK & SLUG
  console.log("\n— Proyek: slug, featured, unggah —");

  await page.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Tambah proyek" }).first().click();
  await page.getByLabel("Judul").fill("Proyek Uji E2E");
  await page.waitForTimeout(400);
  cek(
    "slug diusulkan otomatis dari judul",
    (await page.getByLabel("Slug").inputValue()) === "proyek-uji-e2e",
    await page.getByLabel("Slug").inputValue(),
  );

  // Slug tidak aman untuk URL ditolak.
  await page.getByLabel("Slug").fill("Slug Dengan Spasi");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(800);
  cek(
    "slug tidak aman untuk URL ditolak",
    (await page.getByText("Slug hanya boleh huruf kecil").count()) > 0,
  );

  // Slug bentrok ditolak dengan pesan ramah, bukan error database.
  await page.getByLabel("Slug").fill("sistem-informasi-perpustakaan");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(3000);
  cek(
    "slug bentrok ditolak dengan pesan berbahasa Indonesia",
    (await page.getByText("sudah dipakai proyek lain").count()) > 0,
  );

  // Simpan yang sah, dengan tech stack duplikat + featured + unggah thumbnail.
  await page.getByLabel("Slug").fill("proyek-uji-e2e");
  await page.getByLabel("Ringkasan").fill("Ringkasan proyek uji.");
  for (const t of ["Svelte", "Svelte", "Deno"]) {
    await page.getByLabel("Tambah Tech stack").fill(t);
    await page.getByRole("button", { name: "Tambah", exact: true }).first().click();
    await page.waitForTimeout(200);
  }

  // Jenis berkas tidak diizinkan harus ditolak server.
  await page.locator('input[type="file"]').first().setInputFiles(`${TMP}/uji.txt`);
  await page.waitForTimeout(3000);
  cek(
    "berkas bukan gambar ditolak",
    (await page.getByText("Format gambar tidak didukung").count()) > 0,
  );

  // Unggah gambar yang sah.
  await page.locator('input[type="file"]').first().setInputFiles(`${TMP}/uji.png`);
  await page.waitForTimeout(4000);
  const srcPratinjau = await page
    .locator('img[alt="Pratinjau Thumbnail"]')
    .getAttribute("src")
    .catch(() => null);
  cek(
    "gambar terunggah & pratinjau tampil",
    (srcPratinjau ?? "").includes("/storage/v1/object/public/media/projects/"),
    (srcPratinjau ?? "(tidak ada)").slice(-42),
  );

  await page.getByLabel("Tampilkan di cuplikan beranda (featured)").check();
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(2200);
  cek("proyek tersimpan", (await page.getByText("Proyek ditambahkan.").count()) > 0);

  // Duplikat tech stack dibuang.
  await page.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });
  const barisProyek = await page
    .locator("ul > li")
    .filter({ hasText: "Proyek Uji E2E" })
    .first()
    .textContent();
  const jumlahSvelte = ((barisProyek ?? "").match(/Svelte/g) ?? []).length;
  cek("duplikat tech stack dibuang", jumlahSvelte === 1, `${jumlahSvelte}× Svelte`);

  // Featured → tampil di beranda; detail dapat dibuka.
  await pub.goto(`${BASE}/`, { waitUntil: "load" });
  cek("proyek featured tampil di beranda", (await pub.content()).includes("Proyek Uji E2E"));

  let r = await pub.goto(`${BASE}/proyek/proyek-uji-e2e`, { waitUntil: "load" });
  cek("halaman detail dapat dibuka", r?.status() === 200, `HTTP ${r?.status()}`);
  cek(
    "tech stack baru jadi pilihan filter publik",
    (await (await pub.goto(`${BASE}/proyek`, { waitUntil: "load" }), pub.content())).includes(
      "Svelte",
    ),
  );

  // Sitemap memuat slug baru.
  const sm1 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  cek("sitemap memuat slug baru", sm1.includes("/proyek/proyek-uji-e2e"));

  // ===================================== UBAH SLUG → SLUG LAMA 404
  console.log("\n— Ubah slug —");

  await page.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Sunting Proyek Uji E2E" }).click();
  await page.getByLabel("Slug").fill("proyek-uji-e2e-baru");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(4000);

  r = await pub.goto(`${BASE}/proyek/proyek-uji-e2e-baru`, { waitUntil: "load" });
  cek("slug baru dapat dibuka", r?.status() === 200, `HTTP ${r?.status()}`);

  r = await pub.goto(`${BASE}/proyek/proyek-uji-e2e`, { waitUntil: "load" });
  cek("slug LAMA menjawab 404", r?.status() === 404, `HTTP ${r?.status()}`);

  const sm2 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  cek(
    "sitemap memuat slug baru dan tidak lagi slug lama",
    sm2.includes("/proyek/proyek-uji-e2e-baru") && !sm2.includes("/proyek/proyek-uji-e2e<"),
  );

  // ===================================== HAPUS PROYEK + BERKAS
  console.log("\n— Hapus proyek —");

  await page.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Hapus Proyek Uji E2E" }).click();
  await page.waitForTimeout(400);
  const ketHapus = (await page.getByRole("alertdialog").textContent()) ?? "";
  cek(
    "dialog menyebut berkas Storage ikut terhapus",
    ketHapus.includes("Storage") && ketHapus.includes("sitemap"),
  );
  await page.getByRole("button", { name: "Hapus", exact: true }).last().click();
  await page.waitForTimeout(4000);

  if (srcPratinjau) {
    // Diperiksa lewat Storage API, bukan URL publik: URL publik dilayani CDN
    // dan bisa tetap menjawab 200 dari cache walau objeknya sudah terhapus.
    const tok = await (
      await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: e.ADMIN_EMAIL,
          password: e.ADMIN_TEMP_PASSWORD,
        }),
      })
    ).json();

    const ls = await (
      await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/list/media`, {
        method: "POST",
        headers: {
          apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${tok.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefix: "projects", limit: 100 }),
      })
    ).json();

    const masihAda =
      Array.isArray(ls) && ls.some((o) => srcPratinjau.endsWith(o.name));
    cek(
      "berkas thumbnail terhapus dari Storage",
      !masihAda,
      `${Array.isArray(ls) ? ls.length : "?"} objek tersisa di prefiks projects`,
    );
  }

  const sm3 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  cek("proyek terhapus keluar dari sitemap", !sm3.includes("proyek-uji-e2e"));

  // ===================================== KEAHLIAN: CASCADE
  console.log("\n— Keahlian: cascade —");

  await page.goto(`${BASE}/admin/keahlian`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Hapus Bahasa Pemrograman" }).click();
  await page.waitForTimeout(400);
  const ketKat = (await page.getByRole("alertdialog").textContent()) ?? "";
  cek(
    "konfirmasi menyebut jumlah keahlian yang ikut terhapus",
    /BESERTA \d+ keahlian/.test(ketKat),
    ketKat.match(/BESERTA \d+ keahlian/)?.[0] ?? ketKat.slice(0, 50),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  cek(
    "dibatalkan → kategori masih ada",
    (await page.getByText("Bahasa Pemrograman").count()) > 0,
  );

  // ===================================== PENGALAMAN: MASIH BERJALAN
  console.log("\n— Pengalaman & pendidikan —");

  await page.goto(`${BASE}/admin/pengalaman`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Tambah pengalaman" }).first().click();
  await page.getByLabel("Masih berjalan sampai sekarang").check();
  await page.waitForTimeout(300);
  cek(
    "menandai masih berjalan menonaktifkan tanggal selesai",
    await page.getByLabel("Tanggal selesai").isDisabled(),
  );

  // Rentang tanggal tidak logis ditolak.
  await page.getByLabel("Masih berjalan sampai sekarang").uncheck();
  await page.getByLabel("Posisi").fill("Uji");
  await page.getByLabel("Instansi").fill("Uji");
  await page.getByLabel("Tanggal mulai").fill("2025-06-01");
  await page.getByLabel("Tanggal selesai").fill("2024-01-01");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(900);
  cek(
    "tanggal selesai lebih awal ditolak",
    (await page.getByText("tidak boleh lebih awal").count()) > 0,
  );
  await page.getByRole("button", { name: "Batal" }).click();

  // Pendidikan: tahun selesai lebih awal ditolak.
  await page.goto(`${BASE}/admin/pendidikan`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Tambah pendidikan" }).first().click();
  await page.getByLabel("Institusi").fill("Uji");
  await page.getByLabel("Tahun mulai").fill("2025");
  await page.getByLabel("Tahun selesai").fill("2020");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(900);
  cek(
    "tahun selesai lebih awal ditolak",
    (await page.getByText("tidak boleh lebih awal").count()) > 0,
  );
  await page.getByRole("button", { name: "Batal" }).click();

  // ===================================== PESAN & RATING
  console.log("\n— Pesan & rating —");

  await page.goto(`${BASE}/admin/pesan`, { waitUntil: "load" });
  cek(
    "inbox kosong menampilkan empty state",
    (await page.getByText("Belum ada pesan").count()) > 0,
  );

  await page.goto(`${BASE}/admin/rating`, { waitUntil: "load" });
  cek(
    "moderasi rating kosong menampilkan empty state",
    (await page.getByText("Belum ada rating").count()) > 0,
  );

  // ===================================== REGRESI PUBLIK
  console.log("\n— Regresi halaman publik —");

  const publik = [
    ["/", "Nama Lengkap Anda"],
    ["/tentang", "Tentang Saya"],
    ["/pendidikan", "Universitas Contoh"],
    ["/keahlian", "TypeScript"],
    ["/pengalaman", "Frontend Developer"],
    ["/proyek", "Sistem Informasi Perpustakaan"],
    ["/pencapaian", "Sertifikat"],
    ["/kontak", "mailto:"],
  ];

  for (const [path, penanda] of publik) {
    const res = await pub.goto(`${BASE}${path}`, { waitUntil: "load" });
    const html = await pub.content();
    cek(
      `${path} tetap normal`,
      res?.status() === 200 && html.includes(penanda),
      `HTTP ${res?.status()}`,
    );
  }

  // Navbar publik TIDAK boleh muncul di admin, dan sebaliknya.
  await pub.goto(`${BASE}/`, { waitUntil: "load" });
  const htmlPub = await pub.content();
  cek(
    "halaman publik punya navbar publik",
    htmlPub.includes("Navigasi utama") && !htmlPub.includes("Navigasi dashboard"),
  );

  await page.goto(`${BASE}/admin`, { waitUntil: "load" });
  const htmlAdm = await page.content();
  cek(
    "halaman admin TIDAK lagi memuat navbar publik",
    htmlAdm.includes("Navigasi dashboard") && !htmlAdm.includes("Navigasi utama"),
  );

  // Token warna publik tidak tersentuh gaya admin.
  const aksen = await pub.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
  );
  cek("token aksen publik tetap hijau zamrud", aksen === "#04704f", aksen);

  // Draf tetap tidak terlihat publik.
  cek(
    "proyek draf tetap tidak tampil di publik",
    !(await (await pub.goto(`${BASE}/proyek`, { waitUntil: "load" }), pub.content())).includes(
      "Proyek Yang Belum Selesai",
    ),
  );
} finally {
  await browser.close();
}

console.log(`\n${gagal === 0 ? "Semua pemeriksaan LULUS." : `${gagal} pemeriksaan GAGAL.`}`);
process.exit(gagal === 0 ? 0 : 1);
