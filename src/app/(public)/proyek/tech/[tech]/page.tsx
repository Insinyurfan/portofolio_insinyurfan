import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectGrid } from "@/client/components/projects/project-grid";
import { PageShell } from "@/client/components/ui/primitives";
import { absoluteUrl } from "@/shared/env";
import {
  collectTechStack,
  getProfile,
  getProjects,
  getTechStackSlugs,
} from "@/server/db/queries";
import { techKeSlug } from "@/shared/format";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

/**
 * Daftar proyek yang tersaring menurut satu tech stack.
 *
 * Satu halaman STATIS per tech stack, dibuat saat build dari nilai yang
 * benar-benar dipakai proyek terbit. Itu yang membuat tampilan terfilter ikut
 * di-cache CDN — sebelumnya filter memakai `?tech=` dan memaksa seluruh
 * halaman dirender ulang pada setiap kunjungan.
 *
 * Tech stack baru yang ditambahkan lewat dashboard tetap bisa dibuka: slug di
 * luar daftar tetap dilayani lalu ikut di-cache (dynamicParams bawaan).
 */
export async function generateStaticParams() {
  const daftar = await getTechStackSlugs();
  return daftar.map(({ slug }) => ({ tech: slug }));
}

/** Mencari nama tech stack asli dari slug-nya. Null kalau tidak dipakai proyek mana pun. */
async function techDariSlug(slug: string): Promise<string | null> {
  const projects = await getProjects();
  const cocok = collectTechStack(projects).find((t) => techKeSlug(t) === slug);
  return cocok ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tech: string }>;
}): Promise<Metadata> {
  const { tech: slug } = await params;
  const tech = await techDariSlug(slug);

  if (!tech) {
    return { title: "Tech stack tidak ditemukan" };
  }

  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: `Proyek ${tech}`,
    description: `Proyek ${nama} yang dibangun dengan ${tech}.`,
    alternates: { canonical: `/proyek/tech/${slug}` },
    openGraph: {
      title: `Proyek ${tech} — ${nama}`,
      description: `Proyek ${nama} yang dibangun dengan ${tech}.`,
      url: absoluteUrl(`/proyek/tech/${slug}`),
    },
  };
}

export default async function ProyekTechPage({
  params,
}: {
  params: Promise<{ tech: string }>;
}) {
  const { tech: slug } = await params;
  const tech = await techDariSlug(slug);

  // Slug yang tidak dipakai proyek mana pun → 404, bukan halaman kosong.
  if (!tech) notFound();

  const projects = await getProjects();

  return (
    <PageShell
      title={`Proyek ${tech}`}
      description={`Proyek yang dibangun dengan ${tech}.`}
    >
      <ProjectGrid
        semuaProyek={projects}
        terfilter={projects.filter((p) => p.tech_stack.includes(tech))}
        pilihanTech={collectTechStack(projects)}
        techAktif={tech}
      />
    </PageShell>
  );
}
