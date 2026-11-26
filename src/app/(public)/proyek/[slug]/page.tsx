import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectDetails } from "@/client/components/projects/project-details";
import { absoluteUrl } from "@/shared/env";
import { getProjectBySlug, getPublishedProjectSlugs } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

/**
 * Slug proyek terbit di-prerender. Slug di luar daftar tetap dilayani
 * (dynamicParams default true), sehingga proyek baru langsung bisa dibuka lalu
 * ikut di-cache — dan slug yang tidak ada berakhir di notFound().
 */
export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Proyek tidak ditemukan",
      description: "Proyek yang Anda cari tidak ada atau belum diterbitkan.",
    };
  }

  const deskripsi =
    project.summary ?? `Detail proyek ${project.title} beserta tech stack dan tautannya.`;

  return {
    title: project.title,
    description: deskripsi,
    alternates: { canonical: `/proyek/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: deskripsi,
      url: absoluteUrl(`/proyek/${project.slug}`),
      // Thumbnail proyek dipakai sebagai gambar Open Graph bila ada.
      images: [
        {
          url: project.thumbnail_url ?? absoluteUrl("/og.svg"),
          alt: `Thumbnail proyek ${project.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: deskripsi,
      images: [project.thumbnail_url ?? absoluteUrl("/og.svg")],
    },
  };
}

export default async function ProyekDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  // Slug tidak dikenal, ATAU proyeknya belum terbit → 404, bukan isi proyek.
  if (!project) notFound();

  return (
    <article className="wadah py-12 sm:py-16">
      <Link
        href="/proyek"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke daftar proyek
      </Link>
      <h1 className="mt-6 mb-8 text-3xl sm:text-4xl">{project.title}</h1>
      <ProjectDetails project={project} />
    </article>
  );
}
