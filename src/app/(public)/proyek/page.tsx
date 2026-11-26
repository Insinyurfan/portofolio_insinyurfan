import type { Metadata } from "next";

import { ProjectGrid } from "@/client/components/projects/project-grid";
import { PageShell } from "@/client/components/ui/primitives";
import {
  getPageIntro,
  getProfile,
  getProjects,
} from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Proyek",
    description: `Kumpulan proyek yang pernah dikerjakan ${nama}, beserta detail dan dokumentasinya.`,
    alternates: { canonical: "/proyek" },
  };
}

export default async function ProyekPage() {
  const [intro, projects] = await Promise.all([getPageIntro("proyek"), getProjects()]);

  return (
    <PageShell
      hero={intro}
      title="Proyek"
      description="Kumpulan karya digital saya. Buka setiap proyek untuk melihat hasil dan teknologi yang digunakan."
    >
      <ProjectGrid projects={projects} />
    </PageShell>
  );
}
