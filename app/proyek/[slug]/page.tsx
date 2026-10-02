import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiGithub } from "react-icons/si";

import {
  Badge,
  ButtonExternal,
  Card,
  SectionHeading,
} from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { absoluteUrl } from "@/lib/env";
import { keParagraf } from "@/lib/format";
import { getProjectBySlug, getPublishedProjectSlugs } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

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

  const paragraf = keParagraf(project.description);

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/proyek"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke daftar proyek
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl sm:text-4xl">{project.title}</h1>

        {project.summary ? (
          <p className="mt-3 max-w-2xl text-base text-text-muted sm:text-lg">
            {project.summary}
          </p>
        ) : null}

        {project.tech_stack.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.tech_stack.map((tech) => (
              <li key={tech}>
                <Badge tone="accent">{tech}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Tombol untuk tautan yang tidak ada tidak dirender sama sekali. */}
        {project.demo_url || project.repo_url ? (
          <div className="mt-6 flex flex-wrap gap-3">
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
      </header>

      {project.thumbnail_url ? (
        <Reveal className="mt-10">
          <div className="relative aspect-16/9 w-full overflow-hidden rounded-card-lg border border-border-subtle bg-surface-sunken">
            <Image
              src={project.thumbnail_url}
              alt={`Thumbnail proyek ${project.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </Reveal>
      ) : null}

      {paragraf.length > 0 ? (
        <Reveal className="mt-10">
          <Card>
            <SectionHeading>Tentang proyek ini</SectionHeading>
            <div className="space-y-4">
              {paragraf.map((isi, index) => (
                <p
                  key={`${index}-${isi.slice(0, 16)}`}
                  className="text-base leading-relaxed text-text-muted"
                >
                  {isi}
                </p>
              ))}
            </div>
          </Card>
        </Reveal>
      ) : null}

      {/* Tanpa gambar galeri, bagian galeri tidak dirender. */}
      {project.gallery.length > 0 ? (
        <section className="mt-12">
          <SectionHeading>Galeri</SectionHeading>

          <ul className="grid list-none gap-4 sm:grid-cols-2">
            {project.gallery.map((src, index) => (
              <Reveal as="li" key={src} delay={index * 60}>
                <div className="relative aspect-16/10 w-full overflow-hidden rounded-card border border-border-subtle bg-surface-sunken">
                  <Image
                    src={src}
                    alt={`Galeri proyek ${project.title} — gambar ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
