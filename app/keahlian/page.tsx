import type { Metadata } from "next";

import { Badge, Card, EmptyState, PageShell } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { getProfile, getSkillsByCategory } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

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
  // Query sudah membuang kategori yang tidak punya keahlian terbit.
  const groups = await getSkillsByCategory();

  return (
    <PageShell
      title="Keahlian"
      description="Alat dan teknologi yang saya pakai sehari-hari, dikelompokkan per kategori."
    >
      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada keahlian"
          description="Tambahkan kategori beserta keahliannya di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <div className="bento-grid">
          {groups.map((group, index) => (
            <Reveal key={group.id} delay={index * 80}>
              <Card className="h-full">
                <h2 className="font-heading text-lg font-bold text-text">
                  {group.name}
                </h2>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <li key={skill.id}>
                      {/* Ikon bersifat opsional: tanpa ikon, nama saja sudah cukup. */}
                      <Badge>{skill.name}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </PageShell>
  );
}
