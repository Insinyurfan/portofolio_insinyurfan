import { RatingForm } from "@/components/public/rating-form";
import { StarRating, formatRating } from "@/components/public/star-rating";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import type { RingkasanRating } from "@/lib/queries";
import type { Rating } from "@/lib/types";

const TANGGAL = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Section rating di beranda: rata-rata, daftar yang sudah disetujui, dan form.
 *
 * Nama dan komentar berasal dari pengunjung, jadi keduanya dirender sebagai
 * teks biasa. Tidak ada tempat di sini yang menyisipkan HTML dari nilai itu.
 */
export function RatingsSection({
  ringkasan,
  ratings,
}: {
  ringkasan: RingkasanRating;
  ratings: Rating[];
}) {
  return (
    <section className="border-t border-border-subtle py-12 sm:py-16">
      <SectionHeading>Penilaian</SectionHeading>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-4">
          {/* Rata-rata. Tanpa rating disetujui, yang tampil adalah keterangan
              berbahasa Indonesia — bukan angka nol, yang akan terbaca sebagai
              penilaian buruk. */}
          {ringkasan.total === 0 ? (
            <EmptyState
              title="Belum ada penilaian"
              description="Jadilah yang pertama memberi penilaian lewat form di samping."
            />
          ) : (
            <Reveal>
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-heading text-4xl font-bold text-text">
                    {formatRating(ringkasan.average)}
                  </p>
                  <div>
                    <StarRating
                      nilai={ringkasan.average}
                      label={`Rata-rata ${formatRating(ringkasan.average)} dari 5 bintang, dari ${ringkasan.total} penilaian`}
                    />
                    <p className="mt-0.5 text-sm text-text-muted">
                      dari {ringkasan.total} penilaian
                    </p>
                  </div>
                </div>

                {ratings.length > 0 ? (
                  <ul className="mt-5 space-y-4 border-t border-border-subtle pt-5">
                    {ratings.map((r) => (
                      <li key={r.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text">
                            {r.reviewer_name}
                          </p>
                          <StarRating nilai={r.stars} ukuran="sm" />
                          <span className="text-xs text-text-subtle">
                            {TANGGAL.format(new Date(r.created_at))}
                          </span>
                        </div>

                        {/* Komentar tanpa isi tidak meninggalkan area kosong. */}
                        {r.comment ? (
                          <p className="mt-1 whitespace-pre-line text-sm text-text-muted">
                            {r.comment}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </Reveal>
          )}
        </div>

        <Reveal delay={100}>
          <RatingForm />
        </Reveal>
      </div>
    </section>
  );
}
