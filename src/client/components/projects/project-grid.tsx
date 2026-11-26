import { ProjectCard } from "@/client/components/projects/project-card";
import { EmptyState } from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import type { Project } from "@/shared/types";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="Belum ada proyek"
        description="Proyek yang diterbitkan akan tampil di sini."
      />
    );
  }

  return (
    <ul className="bento-grid bento-lebar list-none">
      {projects.map((project, index) => (
        <Reveal as="li" key={project.id} delay={index * 60}>
          <ProjectCard project={project} priority={index === 0} />
        </Reveal>
      ))}
    </ul>
  );
}
