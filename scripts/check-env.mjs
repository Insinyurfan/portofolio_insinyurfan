/**
 * Memastikan setiap variabel lingkungan WAJIB ada di .env.local.
 *
 * Ini bukan duplikasi dari src/shared/env.ts. Variabel di sana dibaca saat kode yang
 * membutuhkannya berjalan, dan tidak semuanya ikut dievaluasi saat build —
 * ADMIN_LOGIN_PATH khususnya hanya dibaca proxy pada permintaan ke /admin.
 *
 * Akibatnya, kalau ADMIN_LOGIN_PATH tidak diatur di Vercel: build berhasil,
 * situs berjalan normal, dan pemilik terkunci dari dashboardnya sendiri tanpa
 * pesan error di mana pun, karena /admin dialihkan ke beranda dan tidak ada
 * alamat lain yang melayani halaman masuk. Skrip inilah yang menangkapnya
 * sebelum deploy, bukan setelah.
 *
 * Jalankan: node scripts/check-env.mjs
 */

import { bacaEnvLokal } from "./env-lokal.mjs";

const env = bacaEnvLokal(new URL("../.env.local", import.meta.url));

/** Nama variabel wajib, beserta pemeriksaan bentuk nilainya bila ada. */
const WAJIB = [
  { nama: "NEXT_PUBLIC_SUPABASE_URL", bentuk: (v) => v.startsWith("https://") || "harus URL https" },
  { nama: "NEXT_PUBLIC_SUPABASE_ANON_KEY" },
  { nama: "NEXT_PUBLIC_SITE_URL", bentuk: (v) => /^https?:\/\//.test(v) || "harus URL http(s)" },
  { nama: "ADMIN_EMAIL", bentuk: (v) => v.includes("@") || "harus alamat email" },
  { nama: "RATE_LIMIT_SALT", bentuk: (v) => v.length >= 16 || "terlalu pendek, minimal 16 karakter" },
  {
    nama: "ADMIN_LOGIN_PATH",
    bentuk: (v) =>
      /^[a-z0-9][a-z0-9-]*$/i.test(v.replaceAll("/", "").trim()) ||
      "huruf, angka, dan tanda hubung saja — tanpa garis miring",
  },
];

/** Variabel yang HANYA untuk perkakas lokal dan tidak boleh diatur di Vercel. */
const LOKAL_SAJA = [
  "SUPABASE_DB_URL",
  "SUPABASE_ACCESS_TOKEN",
  "ADMIN_TEMP_PASSWORD",
];

let gagal = 0;

for (const { nama, bentuk } of WAJIB) {
  const nilai = (env[nama] ?? "").trim();

  if (nilai === "") {
    console.log(`  GAGAL  ${nama.padEnd(32)} belum diisi`);
    gagal += 1;
    continue;
  }

  // Awalan NEXT_PUBLIC_ ikut terkirim ke peramban. Tiga variabel server tidak
  // boleh pernah mendapatkannya.
  if (!nama.startsWith("NEXT_PUBLIC_") && env[`NEXT_PUBLIC_${nama}`] !== undefined) {
    console.log(`  GAGAL  ${nama.padEnd(32)} ada juga sebagai NEXT_PUBLIC_${nama}`);
    gagal += 1;
    continue;
  }

  const hasil = bentuk ? bentuk(nilai) : true;
  if (hasil !== true) {
    console.log(`  GAGAL  ${nama.padEnd(32)} ${hasil}`);
    gagal += 1;
    continue;
  }

  console.log(`  LULUS  ${nama.padEnd(32)} terisi`);
}

const adaLokal = LOKAL_SAJA.filter((n) => (env[n] ?? "").trim() !== "");
if (adaLokal.length > 0) {
  console.log(
    `\nHanya untuk perkakas lokal, JANGAN diatur di Vercel: ${adaLokal.join(", ")}`,
  );
}

if (gagal > 0) {
  console.error(
    `\n${gagal} variabel bermasalah. Perbaiki di .env.local, dan pastikan ` +
      `keenam variabel wajib juga sudah diatur di Vercel sebelum deploy.`,
  );
  process.exit(1);
}

console.log("\nSemua variabel lingkungan wajib terisi dan bentuknya sah.");
