import type { Metadata } from "next";

import { SkillsTabs } from "@/client/components/skills/skills-tabs";
import { EmptyState, PageShell } from "@/client/components/ui/primitives";
import {
  getPageIntro,
  getProfile,
  getSkillsByCategory,
} from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Keahlian",
    description: `Keahlian teknis ${nama}, dikelompokkan per kategori.`,
    alternates: { canonical: "/keahlian" },
  };
}

export default async function KeahlianPage() {
  const [intro, groups] = await Promise.all([
    getPageIntro("keahlian"),
    // Query sudah membuang kategori yang tidak punya keahlian terbit.
    getSkillsByCategory(),
  ]);

  const jumlahKeahlian = groups.reduce((n, g) => n + g.skills.length, 0);

  return (
    <PageShell
      hero={intro}
      eyebrow="Alat & teknologi"
      title="Keahlian"
      description="Alat dan teknologi yang saya pakai sehari-hari, dikelompokkan per kategori."
      jumlah={jumlahKeahlian > 0 ? `${jumlahKeahlian} item` : undefined}
    >
      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada keahlian"
          description="Tambahkan kategori beserta keahliannya lewat dashboard admin untuk menampilkannya di sini."
        />
      ) : (
        <SkillsTabs groups={groups} />
      )}
    </PageShell>
  );
}
