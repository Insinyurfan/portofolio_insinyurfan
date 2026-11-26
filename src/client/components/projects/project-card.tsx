"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { ProjectDetails } from "@/client/components/projects/project-details";
import { Modal } from "@/client/components/ui/modal";
import type { Project } from "@/shared/types";

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
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef<HTMLAnchorElement>(null);
  const tutup = useCallback(() => setTerbuka(false), []);

  return (
    <>
      <article className="group flex h-full flex-col rounded-card border border-border-subtle bg-surface-raised shadow-card transition-shadow hover:shadow-card-hover">
        <Link
          ref={pemicuRef}
          href={`/proyek/${project.slug}`}
          prefetch={false}
          aria-haspopup="dialog"
          onNavigate={(event) => {
            event.preventDefault();
            setTerbuka(true);
          }}
          className="flex h-full flex-col overflow-hidden rounded-card focus-visible:outline-offset-4"
        >
          <div className="relative aspect-16/10 w-full overflow-hidden bg-surface-sunken">
            {project.thumbnail_url ? (
              <Image
                src={project.thumbnail_url}
                alt={`Thumbnail proyek ${project.title}`}
                fill
                preload={priority}
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

            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-accent">
              Lihat detail
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      </article>

      <Modal
        terbuka={terbuka}
        onTutup={tutup}
        judul={project.title}
        label="Detail proyek"
        pemicuRef={pemicuRef}
        lebar="lebar"
        className="max-h-[86dvh]"
        isiBisaDifokuskan
      >
        <ProjectDetails project={project} dalamDialog />
      </Modal>
    </>
  );
}
