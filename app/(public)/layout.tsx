import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { absoluteUrl, env } from "@/lib/env";
import { getProfile, getSocialLinks } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

/**
 * Shell situs publik: navbar, footer, dan tautan lompat ke konten utama.
 *
 * Berada di route group (public) supaya dashboard admin TIDAK mewarisinya.
 * Nama folder dalam tanda kurung tidak ikut ke alamat URL, jadi halaman di
 * dalamnya tetap berada di "/", "/tentang", dan seterusnya.
 */
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
    title: { default: judulDasar, template: templateJudul },
    description: deskripsi,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: judulDasar,
      title: judulDasar,
      description: deskripsi,
      url: absoluteUrl("/"),
      images: [
        {
          url: absoluteUrl("/og.svg"),
          width: 1200,
          height: 630,
          alt: nama ?? "Portofolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: judulDasar,
      description: deskripsi,
      images: [absoluteUrl("/og.svg")],
    },
  };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, socialLinks] = await Promise.all([
    getProfile(),
    getSocialLinks(),
  ]);

  return (
    <>
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
    </>
  );
}
