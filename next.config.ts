import type { NextConfig } from "next";

/**
 * Hostname gambar yang diizinkan diturunkan dari NEXT_PUBLIC_SUPABASE_URL,
 * supaya konfigurasi gambar dan konfigurasi Supabase tidak bisa berbeda.
 * Lihat design.md → "Variabel lingkungan divalidasi sekali di lib/env.ts".
 */
function supabaseImageHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!raw || raw.trim() === "") {
    throw new Error(
      [
        "Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL belum diisi.",
        "next.config.ts membutuhkannya untuk menentukan host gambar yang diizinkan.",
        "Salin .env.example menjadi .env.local lalu isi nilainya dari proyek Supabase Anda.",
      ].join(" "),
    );
  }

  try {
    return new URL(raw).hostname;
  } catch {
    throw new Error(
      `Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL bukan URL yang sah: "${raw}". ` +
        "Nilainya harus berbentuk https://<project-ref>.supabase.co — lihat .env.example.",
    );
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHost(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
