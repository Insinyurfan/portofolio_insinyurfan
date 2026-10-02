/**
 * Memastikan setiap route publik memakai periode revalidasi yang sama.
 *
 * Rencana semula adalah mengimpor konstanta REVALIDATE di setiap route, tetapi
 * Next.js menolak `export const revalidate` yang bukan nilai literal — segment
 * config harus bisa dianalisis statis. Jadi nilainya ditulis literal per route,
 * dan skrip ini yang menjaga agar kedelapan route tidak bisa menjadi tidak
 * konsisten: lib/constants.ts tetap satu sumber kebenarannya.
 *
 * Jalankan: node scripts/check-revalidate.mjs
 */

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const APP_DIR = join(ROOT, "app");

/** Nilai acuan diambil dari lib/constants.ts, bukan ditulis ulang di sini. */
const constantsSource = await readFile(join(ROOT, "lib", "constants.ts"), "utf8");
const acuanMatch = constantsSource.match(/export const REVALIDATE\s*=\s*(\d+)/);

if (!acuanMatch) {
  console.error("GAGAL: REVALIDATE tidak ditemukan di lib/constants.ts");
  process.exit(1);
}

const acuan = Number(acuanMatch[1]);

/** Berkas yang wajib mengekspor revalidate. */
const WAJIB = ["page.tsx", "layout.tsx", "sitemap.ts"];

async function kumpulkanBerkas(dir) {
  const hasil = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      hasil.push(...(await kumpulkanBerkas(path)));
    } else if (WAJIB.includes(entry.name)) {
      hasil.push(path);
    }
  }
  return hasil;
}

const berkas = await kumpulkanBerkas(APP_DIR);
const masalah = [];
const baris = [];

for (const path of berkas) {
  const isi = await readFile(path, "utf8");
  const nama = relative(ROOT, path).replace(/\\/g, "/");
  const match = isi.match(/export const revalidate\s*=\s*(\d+)/);

  if (!match) {
    masalah.push(`${nama}: tidak mengekspor revalidate`);
    baris.push(`GAGAL  ${nama.padEnd(34)}  (tidak ada)`);
    continue;
  }

  const nilai = Number(match[1]);
  if (nilai !== acuan) {
    masalah.push(`${nama}: revalidate ${nilai}, seharusnya ${acuan}`);
    baris.push(`GAGAL  ${nama.padEnd(34)}  ${nilai}`);
  } else {
    baris.push(`LULUS  ${nama.padEnd(34)}  ${nilai}`);
  }
}

console.log(`Periode revalidasi acuan (lib/constants.ts): ${acuan} detik\n`);
console.log(baris.sort().join("\n"));

if (masalah.length > 0) {
  console.error(`\n${masalah.length} masalah:\n- ${masalah.join("\n- ")}`);
  process.exit(1);
}

console.log(`\nSemua ${berkas.length} route publik memakai ${acuan} detik.`);
