/**
 * Menjalankan sebuah berkas SQL terhadap database Supabase.
 *
 * Dibuat supaya `supabase/tests/rls_checks.sql` dan `supabase/seed.sql` bisa
 * dijalankan tanpa memasang PostgreSQL client — `psql` tidak selalu ada,
 * sementara Node sudah pasti ada karena proyek ini memang berjalan di atasnya.
 *
 * Koneksi dibaca dari SUPABASE_DB_URL di .env.local. Nilai itu TIDAK boleh
 * berawalan NEXT_PUBLIC_, karena memuat password database.
 *
 * Pemakaian:
 *   node scripts/run-sql.mjs supabase/tests/rls_checks.sql
 *   node scripts/run-sql.mjs supabase/seed.sql
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import pg from "pg";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Pembaca .env sederhana — cukup untuk berkas yang ditulis tangan. */
async function muatEnv() {
  let isi;
  try {
    isi = await readFile(join(ROOT, ".env.local"), "utf8");
  } catch {
    return;
  }

  for (const baris of isi.split(/\r?\n/)) {
    const t = baris.trim();
    if (t === "" || t.startsWith("#")) continue;

    const eq = t.indexOf("=");
    if (eq < 0) continue;

    const kunci = t.slice(0, eq).trim();
    const nilai = t.slice(eq + 1).trim();
    if (!(kunci in process.env)) process.env[kunci] = nilai;
  }
}

await muatEnv();

const berkas = process.argv[2];
if (!berkas) {
  console.error("Pemakaian: node scripts/run-sql.mjs <berkas.sql>");
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "SUPABASE_DB_URL belum diisi di .env.local.\n" +
      "Ambil dari dashboard Supabase → tombol Connect → Connection String → Session pooler,\n" +
      "lalu ganti [YOUR-PASSWORD] dengan password database Anda (tanpa kurung siku).",
  );
  process.exit(1);
}

/**
 * Baris meta psql (diawali backslash) dibuang: skrip SQL-nya ditulis agar bisa
 * dijalankan lewat psql maupun lewat runner ini, dan hanya psql yang
 * mengenali perintah seperti \set atau \echo.
 */
const sqlMentah = await readFile(join(ROOT, berkas), "utf8");
const sql = sqlMentah
  .split(/\r?\n/)
  .filter((baris) => !/^\s*\\/.test(baris))
  .join("\n");

const client = new pg.Client({
  connectionString,
  // Supabase mewajibkan TLS; sertifikatnya dikeluarkan untuk domain pooler.
  ssl: { rejectUnauthorized: false },
});

// NOTICE dari RAISE NOTICE adalah cara skrip pemeriksaan melaporkan hasilnya,
// jadi harus ikut tercetak.
client.on("notice", (n) => console.log(`  ${n.message ?? n}`));

try {
  await client.connect();
  console.log(`Menjalankan ${berkas} ...\n`);
  await client.query(sql);
  console.log(`\n✓ ${berkas} selesai tanpa error.`);
} catch (error) {
  console.error(`\n✗ ${berkas} GAGAL`);
  console.error(`  ${error.message}`);
  if (error.hint) console.error(`  Petunjuk: ${error.hint}`);
  if (error.where) console.error(`  Di: ${error.where}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
