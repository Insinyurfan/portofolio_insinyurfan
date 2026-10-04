import type { Metadata } from "next";

import { ExperienceSection } from "@/client/components/experience/experience-section";
import { PageShell } from "@/client/components/ui/primitives";
import {
  getExperiences,
  getPageIntro,
  getProfile,
} from "@/server/db/queries";

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
  const [intro, experiences] = await Promise.all([
    getPageIntro("pengalaman"),
    getExperiences(),
  ]);

  return (
    <PageShell
      hero={intro}
      eyebrow="Rekam jejak"
      title="Pengalaman"
      description="Pengalaman kerja, magang, organisasi, dan pekerjaan lepas. Buka detail untuk melihat kontribusi dan dokumentasinya."
      jumlah={
        experiences.length > 0 ? `${experiences.length} pengalaman` : undefined
      }
    >
      <ExperienceSection
        semua={experiences}
        terfilter={experiences}
        aktif={null}
      />
    </PageShell>
  );
}
