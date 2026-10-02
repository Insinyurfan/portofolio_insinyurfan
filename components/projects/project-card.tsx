import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/primitives";
import type { Project } from "@/lib/types";

/**
 * Kartu proyek. Dipakai cuplikan beranda dan grid halaman proyek.
 *
 * Thumbnail memakai rasio aspek eksplisit supaya ruangnya sudah dicadangkan
 * sebelum gambar selesai dimuat — itu yang mencegah pergeseran tata letak.
 */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-raised shadow-card transition-shadow hover:shadow-card-hover">
      <Link
        href={`/proyek/${project.slug}`}
        className="flex h-full flex-col focus-visible:outline-offset-4"
      >
        <div className="relative aspect-16/10 w-full overflow-hidden bg-surface-sunken">
          {project.thumbnail_url ? (
            <Image
              src={project.thumbnail_url}
              alt={`Thumbnail proyek ${project.title}`}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center"
            >
              <span className="font-heading text-sm font-semibold text-text-subtle">
                Tanpa gambar
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-heading text-lg font-bold text-text">
            {project.title}
          </h3>

          {project.summary ? (
            <p className="mt-2 line-clamp-3 text-sm text-text-muted">
              {project.summary}
            </p>
          ) : null}

          {project.tech_stack.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.tech_stack.map((tech) => (
                <li key={tech}>
                  <Badge>{tech}</Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Lihat detail
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
