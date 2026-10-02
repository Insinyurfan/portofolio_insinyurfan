import { readFileSync } from "node:fs";

/**
 * Pembaca `.env.local` untuk skrip Node di repositori ini.
 *
 * Next.js punya pembacanya sendiri; ini hanya untuk perkakas yang berjalan di
 * luar Next — pemeriksaan SQL dan skrip verifikasi e2e.
 *
 * Tanda kutip di sekeliling nilai dibuang. Itu bukan detail kosmetik: Vercel
 * CLI menulis ulang `.env.local` dengan setiap nilai dikutip ketika Anda
 * menjalankan `vercel env pull`. Tanpa pembuangan kutip, URL menjadi
 * `"https://…"` lengkap dengan kutipnya dan gagal di-parse.
 */
export function bacaEnvLokal(url = new URL("../.env.local", import.meta.url)) {
  const hasil = {};

  let isi;
  try {
    isi = readFileSync(url, "utf8");
  } catch {
    return hasil;
  }

  for (const baris of isi.split(/\r?\n/)) {
    const t = baris.trim();
    if (t === "" || t.startsWith("#")) continue;

    const eq = t.indexOf("=");
    if (eq < 0) continue;

    const kunci = t.slice(0, eq).trim();
    let nilai = t.slice(eq + 1).trim();

    // Buang sepasang kutip di ujung, bukan kutip yang memang bagian nilai.
    if (
      nilai.length >= 2 &&
      ((nilai.startsWith('"') && nilai.endsWith('"')) ||
        (nilai.startsWith("'") && nilai.endsWith("'")))
    ) {
      nilai = nilai.slice(1, -1);
    }

    hasil[kunci] = nilai;
  }

  return hasil;
}
