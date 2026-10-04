import { ProjectCard } from "@/client/components/projects/project-card";
import { TechFilter } from "@/client/components/projects/tech-filter";
import { ButtonLink, EmptyState } from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import type { Project } from "@/shared/types";

/**
 * Isi halaman daftar proyek, dipakai `/proyek` maupun `/proyek/tech/[tech]`.
 *
 * Keduanya halaman statis: yang satu menampilkan semua proyek, yang lain
 * sudah tersaring sejak di server. Tidak ada state di klien sama sekali.
 */
export function ProjectGrid({
  semuaProyek,
  terfilter,
  pilihanTech,
  techAktif,
}: {
  /** Seluruh proyek terbit — menentukan apakah daftarnya memang kosong. */
  semuaProyek: Project[];
  /** Proyek yang ditampilkan setelah filter diterapkan. */
  terfilter: Project[];
  pilihanTech: string[];
  techAktif: string | null;
}) {
  if (semuaProyek.length === 0) {
    return (
      <EmptyState
        title="Belum ada proyek"
        description="Tambahkan proyek di dashboard admin atau jalankan skrip seed untuk memasukkan data contoh."
      />
    );
  }

  return (
    <>
      <TechFilter options={pilihanTech} active={techAktif} />

      {terfilter.length === 0 ? (
        <EmptyState
          title="Tidak ada proyek yang cocok"
          description={`Belum ada proyek dengan tech stack "${techAktif}". Kosongkan filter untuk melihat semua proyek.`}
          action={
            <ButtonLink href="/proyek" variant="outline">
              Tampilkan semua proyek
            </ButtonLink>
          }
        />
      ) : (
        <ul className="bento-grid bento-lebar list-none">
          {terfilter.map((project, index) => (
            <Reveal as="li" key={project.id} delay={index * 60}>
              <ProjectCard project={project} priority={index === 0} />
            </Reveal>
          ))}
        </ul>
      )}
    </>
  );
}
