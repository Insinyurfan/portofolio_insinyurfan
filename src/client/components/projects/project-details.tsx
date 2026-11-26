import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { SiGithub } from "react-icons/si";

import { ProjectGallery } from "@/client/components/projects/project-gallery";
import { Badge, ButtonExternal, Card } from "@/client/components/ui/primitives";
import { keParagraf } from "@/shared/format";
import type { Project } from "@/shared/types";

export function ProjectDetails({ project, dalamDialog = false }: { project: Project; dalamDialog?: boolean }) {
  const paragraf = keParagraf(project.description);
  const Judul = dalamDialog ? "h3" : "h2";

  return (
    <div className="space-y-6 sm:space-y-8">
      {project.thumbnail_url ? (
        <div className="relative aspect-16/9 max-h-[45dvh] w-full overflow-hidden rounded-card border border-border-subtle bg-surface-sunken">
          <Image
            src={project.thumbnail_url}
            alt={`Sampul proyek ${project.title}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain"
          />
        </div>
      ) : null}

      {project.tech_stack.length > 0 || project.demo_url || project.repo_url ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          {project.tech_stack.length > 0 ? (
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-text">Teknologi</p>
              <ul className="flex list-none flex-wrap gap-1.5">
                {project.tech_stack.map((tech) => (
                  <li key={tech}><Badge tone="accent">{tech}</Badge></li>
                ))}
              </ul>
            </div>
          ) : null}
          {project.demo_url || project.repo_url ? (
            <div className="flex flex-wrap gap-2">
              {project.demo_url ? (
                <ButtonExternal href={project.demo_url} variant="primary">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Lihat demo
                </ButtonExternal>
              ) : null}
              {project.repo_url ? (
                <ButtonExternal href={project.repo_url}>
                  <SiGithub className="size-4" aria-hidden="true" />
                  Lihat repositori
                </ButtonExternal>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {project.summary || paragraf.length > 0 ? (
        <Card>
          <Judul className="text-lg sm:text-xl">Tentang proyek ini</Judul>
          {project.summary ? <p className="prosa mt-3 font-medium text-text">{project.summary}</p> : null}
          {paragraf.length > 0 ? (
            <div className="prosa mt-3 space-y-4 text-sm leading-relaxed text-text-muted sm:text-base">
              {paragraf.map((isi, index) => <p key={index}>{isi}</p>)}
            </div>
          ) : null}
        </Card>
      ) : null}

      {project.gallery.length > 0 ? (
        <section>
          <Judul className="mb-4 text-lg sm:text-xl">Galeri</Judul>
          <ProjectGallery gambar={project.gallery} judul={project.title} />
        </section>
      ) : null}
    </div>
  );
}
