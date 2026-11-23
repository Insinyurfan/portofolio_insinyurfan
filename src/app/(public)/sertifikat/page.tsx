import type { Metadata } from "next";

import { AchievementGrid } from "@/client/components/achievements/achievement-grid";
import { EmptyState, PageShell } from "@/client/components/ui/primitives";
import {
  getAchievements,
  getPageIntro,
  getProfile,
} from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Sertifikat",
    description: `Sertifikat dan penghargaan yang diperoleh ${nama}.`,
    alternates: { canonical: "/sertifikat" },
  };
}

export default async function SertifikatPage() {
  const [intro, achievements] = await Promise.all([getPageIntro("pencapaian"), getAchievements()]);

  return (
    <PageShell
      hero={intro?.headline?.trim().toLowerCase() === "pencapaian" ? { ...intro, headline: "Sertifikat" } : intro}
      title="Sertifikat"
      description="Sertifikat dari sertifikasi, kegiatan kampus, dan pelatihan."
    >
      {achievements.length === 0 ? (
        <EmptyState
          title="Belum ada sertifikat"
        />
      ) : (
        <AchievementGrid achievements={achievements} denganFilter />
      )}
    </PageShell>
  );
}
