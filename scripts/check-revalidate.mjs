/**
 * Menjaga dua aturan caching tetap konsisten:
 *
 *   1. Setiap route PUBLIK memakai periode revalidasi yang sama.
 *      Rencana semula adalah mengimpor konstanta REVALIDATE di setiap route,
 *      tetapi Next.js menolak `export const revalidate` yang bukan nilai
 *      literal — segment config harus bisa dianalisis statis. Jadi nilainya
 *      ditulis literal per route, dan skrip inilah yang mencegahnya melenceng.
 *      src/shared/constants.ts tetap satu sumber kebenarannya.
 *
 *   2. Setiap route ADMIN dirender dinamis.
 *      Halaman admin menampilkan data langsung termasuk draf, dan konten admin
 *      tidak boleh muncul lewat tombol kembali setelah logout. Satu halaman
 *      admin yang lupa `force-dynamic` akan diam-diam di-cache.
 *
 * Jalankan: node scripts/check-revalidate.mjs
 */

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const APP_DIR = join(ROOT, "src", "app");

/** Nilai acuan diambil dari src/shared/constants.ts, bukan ditulis ulang di sini. */
const constantsSource = await readFile(join(ROOT, "src", "shared", "constants.ts"), "utf8");
const acuanMatch = constantsSource.match(/export const REVALIDATE\s*=\s*(\d+)/);

if (!acuanMatch) {
  console.error("GAGAL: REVALIDATE tidak ditemukan di src/shared/constants.ts");
  process.exit(1);
}

const acuan = Number(acuanMatch[1]);

/** Berkas yang membawa segment config. */
const BERKAS_ROUTE = ["page.tsx", "layout.tsx", "sitemap.ts", "robots.ts"];

async function kumpulkanBerkas(dir) {
  const hasil = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      hasil.push(...(await kumpulkanBerkas(path)));
    } else if (BERKAS_ROUTE.includes(entry.name)) {
      hasil.push(path);
    }
  }
  return hasil;
}

const berkas = await kumpulkanBerkas(APP_DIR);
const masalah = [];
const barisPublik = [];
const barisAdmin = [];

for (const path of berkas) {
  const isi = await readFile(path, "utf8");
  const nama = relative(ROOT, path).replace(/\\/g, "/");

  // Route admin: wajib dinamis, TIDAK boleh punya revalidate.
  if (nama.startsWith("src/app/admin/")) {
    const dinamis = /export const dynamic\s*=\s*["']force-dynamic["']/.test(isi);
    if (!dinamis) {
      masalah.push(`${nama}: route admin tanpa dynamic = "force-dynamic"`);
      barisAdmin.push(`GAGAL  ${nama.padEnd(38)}  (tidak dinamis)`);
    } else {
      barisAdmin.push(`LULUS  ${nama.padEnd(38)}  force-dynamic`);
    }
    continue;
  }

  // robots.ts tidak mengambil data, jadi tidak butuh revalidate.
  if (nama === "src/app/robots.ts") continue;

  // Root layout sengaja minimal: shell publik (beserta datanya) ada di
  // src/app/(public)/layout.tsx, jadi revalidate juga ada di sana.
  if (nama === "src/app/layout.tsx") continue;

  // Halaman 404 tidak mengambil data.
  if (nama.endsWith("not-found.tsx")) continue;

  const match = isi.match(/export const revalidate\s*=\s*(\d+)/);

  if (!match) {
    masalah.push(`${nama}: route publik tidak mengekspor revalidate`);
    barisPublik.push(`GAGAL  ${nama.padEnd(38)}  (tidak ada)`);
    continue;
  }

  const nilai = Number(match[1]);
  if (nilai !== acuan) {
    masalah.push(`${nama}: revalidate ${nilai}, seharusnya ${acuan}`);
    barisPublik.push(`GAGAL  ${nama.padEnd(38)}  ${nilai}`);
  } else {
    barisPublik.push(`LULUS  ${nama.padEnd(38)}  ${nilai}`);
  }
}

console.log(`Periode revalidasi acuan (src/shared/constants.ts): ${acuan} detik\n`);
console.log("Route publik — wajib revalidate yang sama:");
console.log(barisPublik.sort().join("\n"));
console.log("\nRoute admin — wajib force-dynamic:");
console.log(barisAdmin.sort().join("\n"));

if (masalah.length > 0) {
  console.error(`\n${masalah.length} masalah:\n- ${masalah.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `\nSemua ${barisPublik.length} route publik memakai ${acuan} detik, dan ${barisAdmin.length} route admin dinamis.`,
);
