import type { Metadata } from "next";

import { EducationCard } from "@/client/components/education/education-card";
import { EmptyState, PageShell } from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import { getEducation, getProfile } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Pendidikan",
    description: `Riwayat pendidikan formal ${nama}, dari jenjang terbaru sampai sebelumnya.`,
    alternates: { canonical: "/pendidikan" },
  };
}

export default async function PendidikanPage() {
  const education = await getEducation();

  return (
    <PageShell
      eyebrow="Riwayat akademik"
      title="Pendidikan"
      description="Jenjang yang pernah dan sedang ditempuh, beserta fokus bidang, lokasi, dan capaian di masing-masing."
      // Hitungan disembunyikan saat kosong, supaya tidak muncul "0 jenjang"
      // tepat di atas empty state yang sudah menjelaskan hal yang sama.
      jumlah={
        education.length > 0 ? `${education.length} jenjang` : undefined
      }
    >
      {education.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat pendidikan"
          description="Tambahkan entri pendidikan lewat dashboard admin untuk menampilkannya di sini."
        />
      ) : (
        <ul className="list-none space-y-4 sm:space-y-5">
          {education.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 80}>
              <EducationCard item={item} />
            </Reveal>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
