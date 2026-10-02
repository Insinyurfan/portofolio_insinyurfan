import type { Metadata } from "next";
import { Suspense } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import { TechFilter } from "@/components/projects/tech-filter";
import { ButtonLink, EmptyState, PageShell } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { collectTechStack, getProfile, getProjects } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Proyek",
    description: `Kumpulan proyek yang pernah dikerjakan ${nama}, dapat disaring menurut tech stack.`,
    alternates: { canonical: "/proyek" },
  };
}

export default async function ProyekPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string | string[] }>;
}) {
  const [projects, params] = await Promise.all([getProjects(), searchParams]);

  const options = collectTechStack(projects);

  // Param yang tidak cocok dengan tech stack mana pun diperlakukan sebagai
  // tanpa filter, supaya URL yang disunting sembarangan tidak bikin halaman
  // tampak rusak.
  const diminta = Array.isArray(params.tech) ? params.tech[0] : params.tech;
  const active =
    diminta && options.includes(diminta) ? diminta : null;

  const terfilter = active
    ? projects.filter((project) => project.tech_stack.includes(active))
    : projects;

  return (
    <PageShell
      title="Proyek"
      description="Proyek yang pernah saya kerjakan. Gunakan filter untuk menyaring menurut tech stack."
    >
      {projects.length === 0 ? (
        <EmptyState
          title="Belum ada proyek"
          description="Tambahkan proyek di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <>
          <Suspense fallback={<div className="mb-8 h-10" />}>
            <TechFilter options={options} active={active} />
          </Suspense>

          {terfilter.length === 0 ? (
            <EmptyState
              title="Tidak ada proyek yang cocok"
              description={`Belum ada proyek dengan tech stack "${active}". Kosongkan filter untuk melihat semua proyek.`}
              action={
                <ButtonLink href="/proyek" variant="outline">
                  Tampilkan semua proyek
                </ButtonLink>
              }
            />
          ) : (
            <ul className="bento-grid list-none">
              {terfilter.map((project, index) => (
                <Reveal as="li" key={project.id} delay={index * 60}>
                  <ProjectCard project={project} priority={index === 0} />
                </Reveal>
              ))}
            </ul>
          )}
        </>
      )}
    </PageShell>
  );
}
