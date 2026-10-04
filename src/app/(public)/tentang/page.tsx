import type { Metadata } from "next";
import { Briefcase, MapPin } from "lucide-react";

import { Badge, Card, EmptyState, PageShell } from "@/client/components/ui/primitives";
import { ProfilePhoto } from "@/client/components/ui/profile-photo";
import { Reveal } from "@/client/components/ui/reveal";
import { keParagraf } from "@/shared/format";
import {
  getPageIntro,
  getProfile,
} from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Tentang Saya",
    description:
      profile?.tagline ??
      `Kenali ${nama} lebih dekat — latar belakang, fokus pekerjaan, dan cara menghubungi.`,
    alternates: { canonical: "/tentang" },
  };
}

export default async function TentangPage() {
  const intro = await getPageIntro("tentang");
  const profile = await getProfile();
  const paragraf = keParagraf(profile?.bio ?? null);

  return (
    <PageShell
      hero={intro}
      title="Tentang Saya"
      description="Sedikit cerita tentang latar belakang dan apa yang sedang saya kerjakan."
    >
      {!profile ? (
        <EmptyState
          title="Profil belum diisi"
          description="Isi tabel profile di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <Reveal>
            <Card>
              {paragraf.length === 0 ? (
                <EmptyState
                  title="Bio belum diisi"
                  description="Tambahkan bio pada profil untuk menampilkannya di halaman ini."
                />
              ) : (
                <div className="prosa space-y-4">
                  {paragraf.map((isi, index) => (
                    <p
                      key={`${index}-${isi.slice(0, 16)}`}
                      className="text-base leading-relaxed text-text-muted"
                    >
                      {isi}
                    </p>
                  ))}
                </div>
              )}

              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-border-subtle pt-5 text-sm">
                {profile.location ? (
                  <div>
                    <dt className="text-text-subtle">Lokasi</dt>
                    <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-text">
                      <MapPin className="size-4" aria-hidden="true" />
                      {profile.location}
                    </dd>
                  </div>
                ) : null}

                <div>
                  <dt className="text-text-subtle">Status</dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-text">
                    <Briefcase className="size-4" aria-hidden="true" />
                    {profile.is_open_to_work
                      ? "Terbuka untuk pekerjaan"
                      : "Sedang tidak mencari posisi baru"}
                  </dd>
                </div>
              </dl>

              {profile.is_open_to_work ? (
                <div className="mt-5">
                  <Badge tone="accent">● Terbuka untuk pekerjaan</Badge>
                </div>
              ) : null}
            </Card>
          </Reveal>

          <Reveal delay={100} className="order-first lg:order-last">
            <ProfilePhoto
              photoUrl={profile.photo_url}
              fullName={profile.full_name}
              size={256}
              className="size-44 sm:size-64"
            />
          </Reveal>
        </div>
      )}
    </PageShell>
  );
}
