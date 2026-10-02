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
  | "NEXT_PUBLIC_SITE_URL";

const KETERANGAN: Record<EnvName, string> = {
  NEXT_PUBLIC_SUPABASE_URL:
    "URL proyek Supabase (Project Settings > Data API > Project URL)",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "kunci anon Supabase (Project Settings > API Keys > anon public)",
  NEXT_PUBLIC_SITE_URL:
    "URL dasar situs tanpa garis miring di akhir, misalnya http://localhost:3000",
};

function wajib(nama: EnvName): string {
  const nilai = process.env[nama];

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

/** URL absolut dari path relatif, untuk kanonik/Open Graph/sitemap. */
export function absoluteUrl(path = "/"): string {
  return `${env.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
