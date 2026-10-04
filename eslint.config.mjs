import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * Batas antara frontend dan backend ditegakkan di sini.
 *
 * Tanpa aturan ini, pemisahan src/server dan src/client hanya soal nama
 * folder: satu impor yang keliru dari komponen peramban ke modul database
 * sudah cukup membuat batasnya hilang diam-diam. Aturan di bawah membuat
 * pelanggaran itu gagal di `npm run lint`, bukan ditemukan belakangan.
 *
 * Jaring kedua tetap ada dan tidak digantikan: modul di src/server/ menandai
 * dirinya `server-only`, sehingga impor terlarang juga menggagalkan build.
 * Yang satu memberi pesan jelas lebih awal, yang satu lagi menutup celahnya.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescriptConfig,

  {
    // FRONTEND: komponen dan hook yang berjalan di peramban.
    files: ["src/client/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/db/*", "@/server/auth", "@/server/db"],
              message:
                "Komponen klien tidak boleh mengakses database atau sesi secara langsung. " +
                "Ambil datanya di Server Component lalu teruskan sebagai prop, atau panggil " +
                "Server Action di @/server/actions/.",
            },
            {
              group: ["@supabase/supabase-js", "@supabase/ssr"],
              message:
                "Klien Supabase tidak boleh masuk ke bundel peramban — ukurannya besar dan " +
                "membawa kunci serta logika sesi ke sisi yang salah. Seluruh akses Supabase " +
                "lewat src/server/.",
            },
            {
              group: ["pg", "node:*"],
              message:
                "Modul Node tidak tersedia di peramban. Pindahkan logikanya ke src/server/.",
            },
          ],
        },
      ],
    },
  },

  {
    // MILIK BERSAMA: dipakai kedua sisi, jadi harus tetap netral.
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*", "@/client/*"],
              message:
                "src/shared/ dipakai KEDUA sisi, jadi tidak boleh bergantung pada salah " +
                "satunya. Mengimpor dari src/server/ akan menyeret kode server ke bundel " +
                "peramban; mengimpor dari src/client/ membalik arah ketergantungannya.",
            },
          ],
        },
      ],
    },
  },

  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
