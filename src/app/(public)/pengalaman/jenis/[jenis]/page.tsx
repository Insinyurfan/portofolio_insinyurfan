import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  SLUG_JENIS,
  jenisDariSlug,
} from "@/client/components/experience/experience-filter";
import { ExperienceSection } from "@/client/components/experience/experience-section";
import { PageShell } from "@/client/components/ui/primitives";
import { absoluteUrl } from "@/shared/env";
import { labelExperienceType } from "@/shared/format";
import {
  getExperiences,
  getPageIntro,
  getProfile,
} from "@/server/db/queries";
import type { ExperienceType } from "@/shared/types";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

/**
 * Daftar pengalaman yang tersaring menurut satu jenis.
 *
 * Satu halaman STATIS per jenis, dibuat saat build dari jenis yang
 * benar-benar dipakai entri terbit. Itu yang membuat tampilan terfilter ikut
 * di-cache CDN — mengikuti keputusan yang sama seperti `/proyek/tech/[tech]`,
 * yang diambil setelah versi berparameter alamat terukur enam kali lebih
 * lambat.
 */
export async function generateStaticParams() {
  const experiences = await getExperiences();
  const dipakai = new Set(experiences.map((e) => e.type));

  return [...dipakai].map((jenis) => ({ jenis: SLUG_JENIS[jenis] }));
}

/**
 * Jenis yang belum dipakai entri mana pun tetap boleh dirender saat diminta,
 * lalu ikut di-cache — jadi menambah pengalaman berjenis baru tidak perlu
 * build ulang. Slug yang bukan jenis sah tetap menjawab 404.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jenis: string }>;
}): Promise<Metadata> {
  const { jenis: slug } = await params;
  const jenis = jenisDariSlug(slug);
  if (!jenis) return {};

  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";
  const label = labelExperienceType(jenis);

  return {
    title: `Pengalaman ${label}`,
    description: `Pengalaman ${label.toLowerCase()} ${nama}.`,
    alternates: { canonical: absoluteUrl(`/pengalaman/jenis/${slug}`) },
  };
}

export default async function PengalamanJenisPage({
  params,
}: {
  params: Promise<{ jenis: string }>;
}) {
  const { jenis: slug } = await params;
  const jenis: ExperienceType | null = jenisDariSlug(slug);

  // Slug yang tidak dikenal menjawab 404, bukan daftar kosong: alamat yang
  // tidak pernah sah tidak boleh tampak seperti halaman yang kebetulan kosong.
  if (!jenis) notFound();

  const [intro, semua] = await Promise.all([
    getPageIntro("pengalaman"),
    getExperiences(),
  ]);
  const terfilter = semua.filter((item) => item.type === jenis);

  return (
    <PageShell
      hero={intro}
      eyebrow="Rekam jejak"
      title={`Pengalaman ${labelExperienceType(jenis)}`}
      description="Pengalaman kerja, magang, organisasi, dan pekerjaan lepas. Buka detail untuk melihat kontribusi dan dokumentasinya."
      jumlah={terfilter.length > 0 ? `${terfilter.length} pengalaman` : undefined}
    >
      <ExperienceSection semua={semua} terfilter={terfilter} aktif={jenis} />
    </PageShell>
  );
}
