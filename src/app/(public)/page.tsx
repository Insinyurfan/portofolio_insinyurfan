import { Download, Mail, MapPin } from "lucide-react";

import { AchievementGrid } from "@/client/components/achievements/achievement-grid";
import { EducationCard } from "@/client/components/education/education-card";
import { ExperienceTimeline } from "@/client/components/experience/experience-timeline";
import { ProfileCarousel } from "@/client/components/home/profile-carousel";
import { SectionBeranda } from "@/client/components/home/section-beranda";
import { TypingRoles } from "@/client/components/home/typing-roles";
import { SocialIconLinks } from "@/client/components/layout/social-icon-links";
import { ProjectCard } from "@/client/components/projects/project-card";
import { ContactForm } from "@/client/components/public/contact-form";
import { CvPreview } from "@/client/components/public/cv-preview";
import { RatingsSection } from "@/client/components/public/ratings-section";
import { SkillsTabs } from "@/client/components/skills/skills-tabs";
import {
  Badge,
  ButtonExternal,
  ButtonLink,
  Card,
  EmptyState,
} from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import {
  getAchievements,
  getApprovedRatings,
  getEducation,
  getExperiences,
  getFeaturedProjects,
  getProfile,
  getRatingSummary,
  getSkillsByCategory,
  getSocialLinks,
} from "@/server/db/queries";
import { keParagraf } from "@/shared/format";
import { fotoProfil } from "@/shared/profil";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

/**
 * Beranda satu halaman.
 *
 * Seluruh bagian situs ikut tampil di sini, berurutan ke bawah, sementara
 * halaman tersendiri tetap ada untuk setiap bagian. Pengunjung yang hanya
 * menggulir mendapat gambaran utuh tanpa berpindah halaman; yang ingin satu
 * bagian saja tetap punya alamat yang dapat dibagikan.
 *
 * Seluruh data diambil dalam SATU `Promise.all`. Kalau dirangkai berurutan,
 * sembilan query akan saling menunggu dan waktu rendernya menjadi jumlah
 * semuanya, bukan yang terlama saja. Halamannya statis, jadi ongkos ini hanya
 * terjadi saat build dan revalidasi — bukan di setiap kunjungan.
 */
export default async function BerandaPage() {
  const [
    profile,
    socialLinks,
    featured,
    ringkasanRating,
    ratings,
    education,
    skillGroups,
    experiences,
    achievements,
  ] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getFeaturedProjects(),
    getRatingSummary(),
    getApprovedRatings(),
    getEducation(),
    getSkillsByCategory(),
    getExperiences(),
    getAchievements(),
  ]);

  // Beranda harus tetap dirender dengan status sukses walau profil belum ada.
  if (!profile) {
    return (
      <div className="wadah py-20">
        <EmptyState
          title="Konten belum tersedia"
          description="Profil belum diisi, jadi belum ada yang bisa ditampilkan di beranda. Isi profil lewat dashboard admin untuk memulai."
        />
      </div>
    );
  }

  const foto = fotoProfil(profile);
  const paragrafBio = keParagraf(profile.bio);

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
              <ButtonLink href="#proyek">Lihat Proyek</ButtonLink>
              <ButtonLink href="#kontak" variant="outline">
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

          {foto.length > 0 ? (
            <div className="w-full sm:w-72 lg:w-80 2xl:w-96">
              <ProfileCarousel
                photos={foto}
                fullName={profile.full_name}
                priority
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* -------------------------------------------------------------- Tentang */}
      {paragrafBio.length > 0 ? (
        <SectionBeranda
          id="tentang"
          eyebrow="Tentang"
          judul="Tentang Saya"
          tautan={{ href: "/tentang", label: "Selengkapnya" }}
        >
          <Reveal>
            <Card>
              <div className="prosa space-y-4">
                {paragrafBio.map((isi, index) => (
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
        </SectionBeranda>
      ) : null}

      {/* ----------------------------------------------------------- Pendidikan */}
      {education.length > 0 ? (
        <SectionBeranda
          id="pendidikan"
          eyebrow="Riwayat akademik"
          judul="Pendidikan"
          tautan={{ href: "/pendidikan", label: "Lihat semua" }}
        >
          <ul className="list-none space-y-4 sm:space-y-5">
            {education.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <EducationCard item={item} />
              </Reveal>
            ))}
          </ul>
        </SectionBeranda>
      ) : null}

      {/* ------------------------------------------------------------- Keahlian */}
      {skillGroups.length > 0 ? (
        <SectionBeranda
          id="keahlian"
          eyebrow="Alat & teknologi"
          judul="Keahlian"
          tautan={{ href: "/keahlian", label: "Lihat semua" }}
        >
          <SkillsTabs groups={skillGroups} />
        </SectionBeranda>
      ) : null}

      {/* ----------------------------------------------------------- Pengalaman */}
      {experiences.length > 0 ? (
        <SectionBeranda
          id="pengalaman"
          eyebrow="Rekam jejak"
          judul="Pengalaman"
          tautan={{ href: "/pengalaman", label: "Lihat semua" }}
        >
          <ExperienceTimeline items={experiences} />
        </SectionBeranda>
      ) : null}

      {/* --------------------------------------------------------------- Proyek */}
      <SectionBeranda
        id="proyek"
        eyebrow="Karya"
        judul="Proyek Pilihan"
        tautan={{ href: "/proyek", label: "Lihat semua proyek" }}
      >
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
      </SectionBeranda>

      {/* ----------------------------------------------------------- Pencapaian */}
      {achievements.length > 0 ? (
        <SectionBeranda
          id="pencapaian"
          eyebrow="Penghargaan"
          judul="Pencapaian"
          tautan={{ href: "/pencapaian", label: "Lihat semua" }}
        >
          <AchievementGrid achievements={achievements} />
        </SectionBeranda>
      ) : null}

      <RatingsSection ringkasan={ringkasanRating} ratings={ratings} />

      {/* --------------------------------------------------------------- Kontak */}
      <SectionBeranda
        id="kontak"
        eyebrow="Hubungi saya"
        judul="Kontak"
        deskripsi="Kirim pesan lewat form, atau hubungi langsung lewat kanal di bawah."
        tautan={{ href: "/kontak", label: "Halaman kontak" }}
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-start *:min-w-0">
          <Reveal>
            <Card>
              <ContactForm />
            </Card>
          </Reveal>

          <Reveal delay={100}>
            <Card>
              <h3 className="mb-4 font-heading text-lg font-bold text-text">
                Atau hubungi langsung
              </h3>
              <dl className="space-y-5">
                {profile.email ? (
                  <div>
                    <dt className="text-sm text-text-subtle">Email</dt>
                    <dd className="mt-1">
                      {/* `break-all` pada teksnya: alamat email adalah satu kata
                       * tanpa spasi, jadi ia tidak punya tempat berganti baris
                       * dan akan melebarkan kartunya di layar sempit. */}
                      <a
                        href={`mailto:${profile.email}`}
                        className="inline-flex items-start gap-2 font-heading text-lg font-semibold text-accent hover:underline"
                      >
                        <Mail className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <span className="break-all">{profile.email}</span>
                      </a>
                    </dd>
                  </div>
                ) : null}

                {profile.location ? (
                  <div>
                    <dt className="text-sm text-text-subtle">Lokasi</dt>
                    <dd className="mt-1 inline-flex items-center gap-2 font-medium text-text">
                      <MapPin className="size-4" aria-hidden="true" />
                      {profile.location}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-6 border-t border-border-subtle pt-5">
                <SocialIconLinks links={socialLinks} />
              </div>
            </Card>
          </Reveal>
        </div>
      </SectionBeranda>
    </div>
  );
}
