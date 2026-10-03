/**
 * Menyetel password akun admin langsung di database Supabase.
 *
 * Kenapa skrip ini ada. Dashboard Supabase hanya menawarkan "Send password
 * recovery" dan "Send magic link" — keduanya lewat email, dan keduanya
 * mengarahkan ke Site URL proyek. Portofolio ini sengaja TIDAK punya halaman
 * reset password (pemiliknya satu orang, dan alur "lupa password" publik hanya
 * menambah permukaan serang), sehingga link di email itu tidak pernah mendarat
 * di halaman yang bisa menanganinya.
 *
 * Password dibaca dari ADMIN_TEMP_PASSWORD di .env.local, TIDAK dari argumen
 * baris perintah. Argumen baris perintah tersimpan di riwayat shell dan
 * terlihat di daftar proses; berkas .env.local sudah gitignored dan memang
 * tempatnya kredensial lokal. Nilainya tidak pernah dicetak ke layar.
 *
 * Nilainya dikirim sebagai parameter query, bukan disisipkan ke teks SQL, jadi
 * password berisi tanda kutip atau garis miring tidak merusak apa pun dan
 * tidak membuka celah injeksi.
 *
 * Pemakaian:
 *   1. Isi ADMIN_TEMP_PASSWORD di .env.local dengan password baru
 *   2. node scripts/set-admin-password.mjs
 */

import pg from "pg";

import { bacaEnvLokal } from "./env-lokal.mjs";

const env = bacaEnvLokal(new URL("../.env.local", import.meta.url));

const email = (env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = env.ADMIN_TEMP_PASSWORD ?? "";
const connectionString = process.env.SUPABASE_DB_URL ?? env.SUPABASE_DB_URL;

function berhenti(pesan) {
  console.error(pesan);
  process.exit(1);
}

if (!connectionString) {
  berhenti("SUPABASE_DB_URL belum diisi di .env.local.");
}
if (email === "") {
  berhenti("ADMIN_EMAIL belum diisi di .env.local.");
}
if (password.trim() === "") {
  berhenti(
    "ADMIN_TEMP_PASSWORD belum diisi di .env.local.\n" +
      "Isi dulu baris itu dengan password baru Anda, lalu jalankan ulang.",
  );
}

// Supabase sendiri menolak password di bawah 6 karakter. Batas di sini sengaja
// lebih tinggi: ini kredensial produksi yang menjaga seluruh dashboard.
if (password.length < 12) {
  berhenti(
    `Password di ADMIN_TEMP_PASSWORD hanya ${password.length} karakter. ` +
      "Gunakan minimal 12 karakter — ini password akun admin produksi Anda.",
  );
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const { rows: cocok } = await client.query(
    "select id, email from auth.users where lower(email) = $1",
    [email],
  );

  if (cocok.length === 0) {
    berhenti(
      `Tidak ada akun dengan email ${email} di Authentication > Users.\n` +
        "Periksa kembali nilai ADMIN_EMAIL di .env.local.",
    );
  }
  if (cocok.length > 1) {
    berhenti(
      `Ada ${cocok.length} akun dengan email ${email}. ` +
        "Skrip ini menolak menebak yang mana; rapikan dulu lewat dashboard.",
    );
  }

  const userId = cocok[0].id;

  // Seluruh perubahan berjalan dalam satu transaksi yang hanya di-commit kalau
  // hash barunya terbukti cocok dengan passwordnya. Ini menjaga dari satu
  // kegagalan yang paling mahal: hash tertulis tetapi tidak dapat dipakai
  // masuk, yang berarti pemilik terkunci dari dashboard produksinya dan tidak
  // punya jalan lain untuk kembali.
  await client.query("begin");

  // crypt() dan gen_salt() milik pgcrypto, yang di Supabase terpasang di skema
  // "extensions" — bukan "public". Tanpa kualifikasi skema, pemanggilannya
  // gagal dengan "function does not exist".
  //
  // 'bf' adalah bcrypt, format yang sama dengan yang ditulis Supabase sendiri
  // ($2a$), sehingga baris ini tidak dapat dibedakan dari password yang
  // disetel lewat jalur resminya.
  await client.query(
    `update auth.users
        set encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
            updated_at = now()
      where id = $2`,
    [password, userId],
  );

  // Verifikasi dengan cara yang sama persis seperti Supabase memeriksa saat
  // login: hash ulang password memakai hash tersimpan sebagai salt, lalu
  // bandingkan. Kalau tidak cocok, tidak ada yang jadi berubah.
  const { rows: uji } = await client.query(
    `select encrypted_password = extensions.crypt($1, encrypted_password) as cocok
       from auth.users where id = $2`,
    [password, userId],
  );

  if (uji[0]?.cocok !== true) {
    await client.query("rollback");
    berhenti(
      "Hash baru tidak lolos verifikasi, jadi tidak ada yang diubah.\n" +
        "Password lama Anda masih berlaku. Laporkan ini — jangan dicoba ulang.",
    );
  }

  // Mengubah password lewat SQL TIDAK otomatis mengakhiri sesi yang sudah
  // berjalan — berbeda dari jalur resmi Supabase. Sesi lama dibersihkan di
  // sini supaya token yang beredar sebelum penggantian benar-benar mati.
  const { rowCount: sesiTerhapus } = await client.query(
    "delete from auth.sessions where user_id = $1",
    [userId],
  );
  await client.query(
    "delete from auth.refresh_tokens where user_id = $1",
    [String(userId)],
  );

  await client.query("commit");

  console.log(`Password akun ${email} berhasil diganti.`);
  console.log(`${sesiTerhapus} sesi lama diakhiri; semua perangkat perlu masuk ulang.`);
  console.log(
    "\nNilainya sama dengan ADMIN_TEMP_PASSWORD di .env.local, jadi suite e2e\n" +
      "tetap berjalan tanpa perlu diubah.",
  );
} catch (error) {
  console.error("Gagal mengganti password.");
  console.error(`  ${error.message}`);
  if (error.hint) console.error(`  Petunjuk: ${error.hint}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
