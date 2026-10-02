import type { Metadata } from "next";
import { Briefcase, Mail, MapPin } from "lucide-react";

import { SocialIconLinks } from "@/components/layout/social-icon-links";
import { Badge, Card, EmptyState, PageShell } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { getProfile, getSocialLinks } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const nama = profile?.full_name ?? "Portofolio";

  return {
    title: "Kontak",
    description: `Cara menghubungi ${nama} — email dan tautan media sosial.`,
    alternates: { canonical: "/kontak" },
  };
}

/**
 * Halaman kontak — INFORMASI SAJA.
 *
 * Tidak ada form, input, maupun tombol kirim di change ini. Form kontak yang
 * menulis ke tabel messages dibangun di change `add-contact-rating-and-deploy`.
 */
export default async function KontakPage() {
  const [profile, socialLinks] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <PageShell
      title="Kontak"
      description="Silakan hubungi saya lewat email atau media sosial di bawah ini."
    >
      {!profile ? (
        <EmptyState
          title="Informasi kontak belum tersedia"
          description="Isi tabel profile di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
        />
      ) : (
        <Reveal>
          <Card>
            <dl className="space-y-5">
              {/* Tanpa email, tidak ada tautan mailto yang dirender — bukan tautan rusak. */}
              {profile.email ? (
                <div>
                  <dt className="text-sm text-text-subtle">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-accent hover:underline"
                    >
                      <Mail className="size-5" aria-hidden="true" />
                      {profile.email}
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

              <div>
                <dt className="text-sm text-text-subtle">Status</dt>
                <dd className="mt-1 inline-flex items-center gap-2 font-medium text-text">
                  <Briefcase className="size-4" aria-hidden="true" />
                  {profile.is_open_to_work
                    ? "Terbuka untuk pekerjaan"
                    : "Sedang tidak mencari posisi baru"}
                </dd>
              </div>

              {socialLinks.length > 0 ? (
                <div>
                  <dt className="text-sm text-text-subtle">Media sosial</dt>
                  <dd className="mt-2">
                    <SocialIconLinks links={socialLinks} />
                  </dd>
                </div>
              ) : null}
            </dl>

            {profile.is_open_to_work ? (
              <p className="mt-6 border-t border-border-subtle pt-5">
                <Badge tone="accent">● Sedang terbuka untuk peluang baru</Badge>
              </p>
            ) : null}
          </Card>
        </Reveal>
      )}
    </PageShell>
  );
}
