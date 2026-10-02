import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/lib/env";

import "./globals.css";

/**
 * Root layout — SENGAJA minimal.
 *
 * Hanya memuat dokumen HTML, font, dan provider tema. Navbar dan footer situs
 * publik TIDAK di sini, melainkan di app/(public)/layout.tsx.
 *
 * Alasannya konkret: selama keduanya ada di root layout, dashboard admin ikut
 * mewarisi navbar dan footer publik, sehingga halaman admin punya dua
 * navigasi sekaligus. Route group (public) memisahkan keduanya.
 */

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Judul di sini SENGAJA berupa string biasa, tanpa `template`.
 *
 * `title.template` berlaku untuk segment ANAK, dan app/(public)/layout.tsx
 * adalah salah satunya. Ketika root juga punya template, `title.default`
 * milik (public) ikut dibungkus — hasilnya "Nama — Portofolio — Portofolio".
 *
 * Jadi template hanya didefinisikan di (public)/layout.tsx, yang memang tahu
 * nama pemiliknya. Judul di sini hanya dipakai route di luar grup itu.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Portofolio — CV Digital",
  description:
    "Portofolio dan curriculum vitae digital berisi proyek, pengalaman, keahlian, dan pencapaian.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${inter.variable}`}>
        {/*
          defaultTheme="system", bukan "light": spesifikasi site-shell menuntut
          situs mengikuti preferensi tema sistem ketika pengunjung belum pernah
          memilih. Dengan defaultTheme="light", next-themes memaksa terang dan
          mengabaikan sistem sepenuhnya.

          Syarat "tampilan awal terang" tetap terpenuhi, karena skenarionya
          memang menyebut sistem yang TIDAK meminta tema gelap.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
