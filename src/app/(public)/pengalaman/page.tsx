import type { Metadata } from "next";

import { ExperienceTimeline } from "@/client/components/experience/experience-timeline";
import { EmptyState, PageShell } from "@/client/components/ui/primitives";
import { getExperiences, getProfile } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Pengalaman",
    description: `Pengalaman kerja, magang, organisasi, dan freelance ${nama}.`,
    alternates: { canonical: "/pengalaman" },
  };
}

export default async function PengalamanPage() {
  const experiences = await getExperiences();

  return (
    <PageShell
      eyebrow="Rekam jejak"
      title="Pengalaman"
      description="Pengalaman kerja, magang, organisasi, dan pekerjaan lepas. Buka detail untuk melihat kontribusi dan dokumentasinya."
      jumlah={
        experiences.length > 0 ? `${experiences.length} pengalaman` : undefined
      }
    >
      {experiences.length === 0 ? (
        <EmptyState
          title="Belum ada pengalaman"
          description="Tambahkan entri pengalaman lewat dashboard admin untuk menampilkannya di sini."
        />
      ) : (
        <ExperienceTimeline items={experiences} />
      )}
    </PageShell>
  );
}
