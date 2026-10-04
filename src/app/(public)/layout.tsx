import type { Metadata } from "next";

import { Footer } from "@/client/components/layout/footer";
import { Navbar } from "@/client/components/layout/navbar";
import { absoluteUrl, env } from "@/shared/env";
import { getProfile, getSocialLinks } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

/**
 * Shell situs publik: navbar, footer, dan tautan lompat ke konten utama.
 *
 * Berada di route group (public) supaya dashboard admin TIDAK mewarisinya.
 * Nama folder dalam tanda kurung tidak ikut ke alamat URL, jadi halaman di
 * dalamnya tetap berada di "/", "/tentang", dan seterusnya.
 */
/**
 * Nama situs: yang tampil di header dan dipakai sebagai label merek.
 *
 * Diatur pemilik lewat /admin/profil. Kosong berarti "Portofolio", sehingga
 * situs yang profilnya belum diisi tetap punya header yang masuk akal.
 */
function namaSitus(siteName: string | null | undefined): string {
  const nilai = siteName?.trim();
  return nilai !== undefined && nilai !== "" ? nilai : "Portofolio";
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  // Tanpa profil, judulnya tidak boleh jadi "Portofolio — Portofolio".
  const nama = profile?.full_name ?? null;
  const label = namaSitus(profile?.site_name);
  const judulDasar = nama ? `${nama} — ${label}` : `${label} — CV Digital`;
  const templateJudul = nama ? `%s — ${nama}` : `%s — ${label}`;
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
          alt: nama ?? label,
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
        <Navbar
          identitas={{
            nama: namaSitus(profile?.site_name),
            logoUrl: profile?.logo_url ?? null,
          }}
        />
        <main id="konten-utama" className="flex-1">
          {children}
        </main>
        <Footer profile={profile} socialLinks={socialLinks} />
      </div>
    </>
  );
}
