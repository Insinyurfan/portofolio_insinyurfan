import type { Metadata } from "next";

import { SkillsTabs } from "@/client/components/skills/skills-tabs";
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

  return (
    <div className="wadah py-8 sm:py-12">
      <SkillsTabs groups={groups} intro={intro} halaman />
    </div>
  );
}
