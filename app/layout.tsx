import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { getProfile, getSocialLinks } from "@/lib/queries";
import { absoluteUrl, env } from "@/lib/env";

import "./globals.css";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

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

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  // Tanpa profil, judulnya tidak boleh jadi "Portofolio — Portofolio".
  const nama = profile?.full_name ?? null;
  const judulDasar = nama ? `${nama} — Portofolio` : "Portofolio — CV Digital";
  const templateJudul = nama ? `%s — ${nama}` : "%s — Portofolio";
  const deskripsi =
    profile?.tagline ??
    "Portofolio dan curriculum vitae digital berisi proyek, pengalaman, keahlian, dan pencapaian.";

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: judulDasar,
      template: templateJudul,
    },
    description: deskripsi,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: judulDasar,
      title: judulDasar,
      description: deskripsi,
      url: absoluteUrl("/"),
      images: [{ url: absoluteUrl("/og.svg"), width: 1200, height: 630, alt: nama ?? "Portofolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: judulDasar,
      description: deskripsi,
      images: [absoluteUrl("/og.svg")],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [profile, socialLinks] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#konten-utama"
            className="sr-only rounded-card bg-accent px-4 py-2 text-accent-contrast focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50"
          >
            Lompat ke konten utama
          </a>

          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main id="konten-utama" className="flex-1">
              {children}
            </main>
            <Footer profile={profile} socialLinks={socialLinks} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
