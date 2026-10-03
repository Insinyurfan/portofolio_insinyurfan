/**
 * Satu-satunya tempat variabel lingkungan dibaca dan divalidasi.
 *
 * Halaman dan query tidak perlu bertahan terhadap nilai yang hilang: kalau
 * konfigurasinya kurang, modul ini melempar error yang menyebut nama variabel
 * yang kurang beserta rujukan ke .env.example.
 */

type EnvName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_SITE_URL"
  | "ADMIN_EMAIL"
  | "RATE_LIMIT_SALT"
  | "RESEND_API_KEY"
  | "RESEND_FROM_EMAIL";

const KETERANGAN: Record<EnvName, string> = {
  NEXT_PUBLIC_SUPABASE_URL:
    "URL proyek Supabase (Project Settings > Data API > Project URL)",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "kunci anon Supabase (Project Settings > API Keys > anon public)",
  NEXT_PUBLIC_SITE_URL:
    "URL dasar situs tanpa garis miring di akhir, misalnya http://localhost:3000",
  ADMIN_EMAIL:
    "email satu-satunya akun admin yang boleh masuk ke dashboard",
  RATE_LIMIT_SALT:
    "garam acak untuk hash pengenal pengirim pada pembatasan laju form publik",
  RESEND_API_KEY:
    "kunci API Resend untuk notifikasi email saat ada pesan baru (opsional)",
  RESEND_FROM_EMAIL:
    "alamat pengirim notifikasi email, misalnya Portofolio <noreply@domain-anda.com> (opsional)",
};

/**
 * Nilai dibaca dengan akses properti STATIS, bukan `process.env[nama]`.
 *
 * Ini bukan gaya penulisan, melainkan syarat: Next hanya dapat meng-inline
 * variabel `NEXT_PUBLIC_*` ke bundel peramban kalau diaksesnya statis. Dengan
 * kunci dinamis, nilainya menjadi `undefined` di peramban dan modul ini
 * melempar error saat form login dihidrasi — kegagalan yang tidak terlihat
 * dari `next build` maupun dari pengujian lewat HTTP.
 *
 * ADMIN_EMAIL ikut di peta ini tetapi TIDAK berawalan NEXT_PUBLIC_, jadi di
 * bundel peramban nilainya tetap undefined dan allowlist-nya tidak bocor.
 */
const NILAI: Record<EnvName, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};

/** Nilai opsional: kosong berarti fiturnya dilewati, bukan error. */
function opsional(nama: EnvName): string | null {
  const nilai = NILAI[nama];
  return nilai === undefined || nilai.trim() === "" ? null : nilai.trim();
}

function wajib(nama: EnvName): string {
  const nilai = NILAI[nama];

  if (nilai === undefined || nilai.trim() === "") {
    throw new Error(
      [
        `Variabel lingkungan ${nama} belum diisi.`,
        `Variabel ini berisi ${KETERANGAN[nama]}.`,
        "Salin .env.example menjadi .env.local lalu isi nilainya, kemudian jalankan ulang aplikasi.",
      ].join(" "),
    );
  }

  return nilai.trim();
}

function urlWajib(nama: EnvName): string {
  const nilai = wajib(nama);

  try {
    new URL(nilai);
  } catch {
    throw new Error(
      `Variabel lingkungan ${nama} bukan URL yang sah: "${nilai}". ` +
        `Nilainya harus berisi ${KETERANGAN[nama]} — lihat .env.example.`,
    );
  }

  // Garis miring di akhir dibuang supaya penyusunan URL absolut untuk
  // kanonik, Open Graph, dan sitemap tidak pernah menghasilkan "//".
  return nilai.replace(/\/+$/, "");
}

export const env = {
  supabaseUrl: urlWajib("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: wajib("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: urlWajib("NEXT_PUBLIC_SITE_URL"),
} as const;

/**
 * Email satu-satunya akun admin, dibaca HANYA di sisi server.
 *
 * Sengaja TIDAK ikut di objek `env` di atas: objek itu diimpor juga oleh kode
 * yang berjalan di peramban, dan allowlist admin tidak boleh ikut terkirim ke
 * sana. Fungsi ini hanya dipanggil dari proxy, Server Component, dan
 * Server Action.
 *
 * Variabelnya TIDAK berawalan NEXT_PUBLIC_ — kalau diberi awalan itu, nilainya
 * masuk ke bundel peramban dan allowlist-nya jadi terlihat siapa pun.
 */
export function adminEmail(): string {
  return wajib("ADMIN_EMAIL").toLowerCase();
}

/**
 * Garam untuk hash pengenal pengirim pada pembatasan laju.
 *
 * WAJIB, dan hanya dibaca di server. Tanpa garam, hash alamat IP bisa dibalik
 * dengan menebak seluruh ruang alamat IPv4 — garamnya yang membuat penghitung
 * laju tidak menjadi catatan alamat pengunjung.
 */
export function rateLimitSalt(): string {
  return wajib("RATE_LIMIT_SALT");
}

/**
 * Konfigurasi layanan email, atau null bila belum disetel.
 *
 * Sengaja opsional: form kontak harus tetap berfungsi penuh tanpa ini, dan
 * ketidakhadirannya dicatat sebagai keterangan, bukan kegagalan.
 */
export function konfigurasiEmail(): { apiKey: string; from: string } | null {
  const apiKey = opsional("RESEND_API_KEY");
  const from = opsional("RESEND_FROM_EMAIL");

  if (!apiKey || !from) return null;
  return { apiKey, from };
}

/** URL absolut dari path relatif, untuk kanonik/Open Graph/sitemap. */
export function absoluteUrl(path = "/"): string {
  return `${env.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
