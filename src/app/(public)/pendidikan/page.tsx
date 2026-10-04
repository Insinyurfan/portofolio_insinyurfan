import type { Metadata } from "next";

import {
  Badge,
  EmptyState,
  PageShell,
  Timeline,
  TimelineItem,
} from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import { formatIpk, formatRentangTahun } from "@/shared/format";
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
      title="Pendidikan"
      description="Riwayat pendidikan formal beserta fokus bidang di setiap jenjang."
    >
      {education.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat pendidikan"
          description="Tambahkan entri pendidikan di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <Timeline>
          {education.map((item, index) => {
            const ipk = formatIpk(item.gpa);

            return (
              <Reveal as="li" key={item.id} delay={index * 80} className="list-none">
                <TimelineItem meta={formatRentangTahun(item.start_year, item.end_year)}>
                  <h2 className="font-heading text-lg font-bold text-text">
                    {item.institution}
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    {[item.degree, item.major].filter(Boolean).join(" · ")}
                  </p>

                  {/* IPK hanya dirender kalau ada — tidak pernah menampilkan nilai kosong. */}
                  {ipk ? (
                    <p className="mt-3">
                      <Badge tone="accent">IPK {ipk}</Badge>
                    </p>
                  ) : null}

                  {item.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </TimelineItem>
              </Reveal>
            );
          })}
        </Timeline>
      )}
    </PageShell>
  );
}
