import type { Metadata } from "next";

import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { EmptyState, PageShell } from "@/components/ui/primitives";
import { getAchievements, getProfile } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Pencapaian",
    description: `Sertifikat dan penghargaan yang diperoleh ${nama}.`,
    alternates: { canonical: "/pencapaian" },
  };
}

export default async function PencapaianPage() {
  const achievements = await getAchievements();

  return (
    <PageShell
      title="Pencapaian"
      description="Sertifikat dan penghargaan. Klik salah satu kartu untuk melihat pratinjaunya."
    >
      {achievements.length === 0 ? (
        <EmptyState
          title="Belum ada pencapaian"
          description="Tambahkan sertifikat atau penghargaan di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <AchievementGrid achievements={achievements} />
      )}
    </PageShell>
  );
}
