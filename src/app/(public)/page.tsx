import { Download, MapPin } from "lucide-react";

import { TypingRoles } from "@/client/components/home/typing-roles";
import { SocialIconLinks } from "@/client/components/layout/social-icon-links";
import { ProjectCard } from "@/client/components/projects/project-card";
import { CvPreview } from "@/client/components/public/cv-preview";
import { RatingsSection } from "@/client/components/public/ratings-section";
import {
  Badge,
  ButtonExternal,
  ButtonLink,
  EmptyState,
  SectionHeading,
} from "@/client/components/ui/primitives";
import { ProfilePhoto } from "@/client/components/ui/profile-photo";
import { Reveal } from "@/client/components/ui/reveal";

import {
  getApprovedRatings,
  getFeaturedProjects,
  getProfile,
  getRatingSummary,
  getSocialLinks,
} from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export default async function BerandaPage() {
  const [profile, socialLinks, featured, ringkasanRating, ratings] =
    await Promise.all([
      getProfile(),
      getSocialLinks(),
      getFeaturedProjects(),
      getRatingSummary(),
      getApprovedRatings(),
    ]);

  // Beranda harus tetap dirender dengan status sukses walau profil belum ada.
  if (!profile) {
    return (
      <div className="wadah py-20">
        <EmptyState
          title="Konten belum tersedia"
          description="Profil belum diisi, jadi belum ada yang bisa ditampilkan di beranda. Jalankan skrip seed untuk memasukkan data contoh, atau isi tabel profile di Supabase."
        />
      </div>
    );
  }

  return (
    <div className="wadah">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="py-12 sm:py-20" aria-labelledby="judul-hero">
        <div className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="min-w-0 flex-1">
            {profile.is_open_to_work ? (
              <div className="mb-4">
                <Badge tone="accent">● Terbuka untuk pekerjaan</Badge>
              </div>
            ) : null}

            <h1
              id="judul-hero"
              className="text-4xl leading-tight sm:text-5xl lg:text-6xl"
            >
              {profile.full_name}
            </h1>

            <div className="mt-3">
              <TypingRoles roles={profile.roles} />
            </div>

            {profile.tagline ? (
              <p className="prosa mt-4 text-base text-text-muted sm:text-lg">
                {profile.tagline}
              </p>
            ) : null}

            {profile.location ? (
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-subtle">
                <MapPin className="size-4" aria-hidden="true" />
                {profile.location}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/proyek">Lihat Proyek</ButtonLink>
              <ButtonLink href="/kontak" variant="outline">
                Kontak
              </ButtonLink>
              {/* Kedua tombol CV hanya dirender bila berkasnya memang ada. */}
              {profile.cv_url ? (
                <>
                  <CvPreview
                    cvUrl={profile.cv_url}
                    namaPemilik={profile.full_name}
                  />
                  <ButtonExternal href={profile.cv_url}>
                    <Download className="size-4" aria-hidden="true" />
                    Unduh CV
                  </ButtonExternal>
                </>
              ) : null}
            </div>

            <SocialIconLinks links={socialLinks} className="mt-7" />
          </div>

          <div className="shrink-0">
            {/* Foto ikut membesar di layar lebar. Sejak hero memakai seluruh
             * lebar layar, foto berukuran tetap membuat teks dan foto saling
             * menjauh dengan ruang kosong menganga di antaranya. */}
            <ProfilePhoto
              photoUrl={profile.photo_url}
              fullName={profile.full_name}
              size={352}
              priority
              className="size-40 sm:size-56 lg:size-72 2xl:size-88"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Cuplikan proyek */}
      <section className="border-t border-border-subtle py-12 sm:py-16">
        <SectionHeading
          action={
            <ButtonLink href="/proyek" variant="outline">
              Lihat semua proyek
            </ButtonLink>
          }
        >
          Proyek Pilihan
        </SectionHeading>

        {featured.length === 0 ? (
          <EmptyState
            title="Belum ada proyek pilihan"
            description="Tandai sebuah proyek sebagai featured untuk menampilkannya di sini."
          />
        ) : (
          <ul className="bento-grid list-none">
            {featured.map((project, index) => (
              <Reveal
                as="li"
                key={project.id}
                delay={index * 80}
                className={index === 0 ? "md:col-span-2" : undefined}
              >
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      <RatingsSection ringkasan={ringkasanRating} ratings={ratings} />
    </div>
  );
}
