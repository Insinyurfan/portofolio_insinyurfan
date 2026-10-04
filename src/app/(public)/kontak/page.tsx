import type { Metadata } from "next";
import { Briefcase, Mail, MapPin } from "lucide-react";

import { SocialIconLinks } from "@/client/components/layout/social-icon-links";
import { ContactForm } from "@/client/components/public/contact-form";
import { Badge, Card, EmptyState, PageShell } from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import { getProfile, getSocialLinks } from "@/server/db/queries";

export const revalidate = 300; // = REVALIDATE di src/shared/constants.ts; Next butuh nilai literal

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
 * Halaman kontak.
 *
 * Form kontak berdampingan dengan informasi kontak langsung: pengunjung yang
 * lebih suka mengirim email sendiri tidak dipaksa memakai form.
 */
export default async function KontakPage() {
  const [profile, socialLinks] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <PageShell
      title="Kontak"
      description="Kirim pesan lewat form, atau hubungi saya langsung lewat email dan media sosial."
    >
      {/* `*:min-w-0` adalah pengaman, bukan hiasan: item grid bawaannya
       * `min-width: auto`, sehingga satu isi yang tidak dapat dipotong — email
       * panjang, URL, nama berkas — melebarkan kolomnya melampaui lebar
       * halaman dan memunculkan scroll ke samping. */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-start *:min-w-0">
        {/*
          Form dirender tanpa syarat: ia harus tetap berfungsi walau profil
          belum diisi, dan tidak bergantung pada data profil apa pun.
        */}
        <Reveal>
          <Card>
            <h2 className="font-heading text-lg font-bold text-text">
              Kirim pesan
            </h2>
            <p className="mt-1 mb-5 text-sm text-text-muted">
              Isi form di bawah, saya akan membalas lewat email.
            </p>
            <ContactForm />
          </Card>
        </Reveal>

        {!profile ? (
          <EmptyState
            title="Informasi kontak belum tersedia"
            description="Isi tabel profile di Supabase atau jalankan skrip seed untuk memasukkan data contoh."
          />
        ) : (
          <Reveal delay={100}>
            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold text-text">
                Atau hubungi langsung
              </h2>
              <dl className="space-y-5">
              {/* Tanpa email, tidak ada tautan mailto yang dirender — bukan tautan rusak. */}
              {profile.email ? (
                <div>
                  <dt className="text-sm text-text-subtle">Email</dt>
                  <dd className="mt-1">
                    {/* `break-all` pada teks emailnya, bukan pada tautannya:
                     * alamat email adalah satu kata tanpa spasi, jadi ia tidak
                     * punya tempat untuk berganti baris dan memaksa kartunya
                     * melebar sampai halaman bisa di-scroll ke samping di
                     * layar sempit. Baru terlihat setelah email contoh yang
                     * pendek diganti alamat sungguhan. */}
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
      </div>
    </PageShell>
  );
}
