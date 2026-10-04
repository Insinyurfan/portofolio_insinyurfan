import type { Metadata } from "next";

import {
  Badge,
  EmptyState,
  PageShell,
  Timeline,
  TimelineItem,
} from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import { formatRentangTanggal, labelExperienceType } from "@/shared/format";
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
      title="Pengalaman"
      description="Pengalaman kerja, magang, organisasi, dan pekerjaan lepas."
    >
      {experiences.length === 0 ? (
        <EmptyState
          title="Belum ada pengalaman"
          description="Tambahkan entri pengalaman di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <Timeline>
          {experiences.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 80} className="list-none">
              <TimelineItem
                meta={formatRentangTanggal(
                  item.start_date,
                  item.end_date,
                  item.is_ongoing,
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold text-text">
                      {item.position}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">{item.organization}</p>
                  </div>

                  {/* Label bahasa Indonesia, bukan nilai enum mentah. */}
                  <Badge tone="accent">{labelExperienceType(item.type)}</Badge>
                </div>

                {item.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {item.description}
                  </p>
                ) : null}
              </TimelineItem>
            </Reveal>
          ))}
        </Timeline>
      )}
    </PageShell>
  );
}
