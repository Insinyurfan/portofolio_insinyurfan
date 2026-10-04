import type { Metadata } from "next";

import { ProjectGrid } from "@/client/components/projects/project-grid";
import { PageShell } from "@/client/components/ui/primitives";
import { collectTechStack, getProfile, getProjects } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Proyek",
    description: `Kumpulan proyek yang pernah dikerjakan ${nama}, dapat disaring menurut tech stack.`,
    alternates: { canonical: "/proyek" },
  };
}

/**
 * Daftar seluruh proyek.
 *
 * Halaman ini STATIS. Versi sebelumnya membaca `?tech=` dari searchParams,
 * yang membuatnya dirender ulang pada setiap kunjungan dan tidak pernah
 * di-cache CDN. Filter sekarang menjadi bagian alamat
 * (`/proyek/tech/[tech]`), sehingga setiap kombinasi punya halaman statisnya
 * sendiri.
 */
export default async function ProyekPage() {
  const projects = await getProjects();

  return (
    <PageShell
      title="Proyek"
      description="Proyek yang pernah saya kerjakan. Gunakan filter untuk menyaring menurut tech stack."
    >
      <ProjectGrid
        semuaProyek={projects}
        terfilter={projects}
        pilihanTech={collectTechStack(projects)}
        techAktif={null}
      />
    </PageShell>
  );
}
