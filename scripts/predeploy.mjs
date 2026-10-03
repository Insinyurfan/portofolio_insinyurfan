/**
 * Pemeriksaan sebelum deploy.
 *
 * Menjalankan pemeriksaan tipe, lint, lalu build produksi — berurutan, dan
 * BERHENTI pada kegagalan pertama.
 *
 * Urutannya disengaja: pemeriksaan tipe gagal dalam hitungan detik, build
 * gagal dalam hitungan menit. Gagal di yang murah lebih dulu.
 *
 * Jalankan: npm run predeploy
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * Perintah ditulis sebagai satu string dan dijalankan lewat shell.
 *
 * Node memperingatkan bahwa meneruskan array argumen BERSAMA shell: true tidak
 * aman, karena argumennya digabung tanpa di-escape. Di sini perintahnya tetap
 * dan tidak pernah memuat masukan dari luar, tetapi satu string menghindari
 * peringatan itu sekaligus membuat maksudnya jelas.
 */
const LANGKAH = [
  { nama: "Pemeriksaan tipe", perintah: "npx tsc --noEmit" },
  { nama: "Lint", perintah: "npx eslint ." },
  { nama: "Kontras token", perintah: "node scripts/check-contrast.mjs" },
  { nama: "Konsistensi revalidasi", perintah: "node scripts/check-revalidate.mjs" },
  { nama: "Build produksi", perintah: "npx next build" },
];

console.log("Pemeriksaan sebelum deploy\n");

for (const [index, langkah] of LANGKAH.entries()) {
  const nomor = `${index + 1}/${LANGKAH.length}`;
  process.stdout.write(`[${nomor}] ${langkah.nama} ... `);

  const hasil = spawnSync(langkah.perintah, {
    cwd: ROOT,
    stdio: "pipe",
    shell: true,
    encoding: "utf8",
  });

  if (hasil.status !== 0) {
    console.log("GAGAL\n");
    if (hasil.stdout) console.log(hasil.stdout.trimEnd());
    if (hasil.stderr) console.error(hasil.stderr.trimEnd());
    console.error(
      `\nBerhenti di langkah "${langkah.nama}". Perbaiki dulu, lalu jalankan ulang.`,
    );
    process.exit(1);
  }

  console.log("lulus");
}

console.log("\nSemua pemeriksaan lulus. Siap di-deploy.");
console.log(
  "Jangan lupa: setiap variabel lingkungan wajib harus sudah diatur di Vercel.",
);
