import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";

import { Badge, Card } from "@/client/components/ui/primitives";
import { formatIpk, formatRentangTahun } from "@/shared/format";
import type { Education } from "@/shared/types";

/**
 * Satu kartu riwayat pendidikan.
 *
 * Setiap bagian yang nilainya kosong TIDAK dirender sama sekali — bukan
 * ditampilkan sebagai baris kosong atau tanda hubung. Riwayat yang hanya
 * memuat nama institusi dan tahun tetap menghasilkan kartu yang utuh, karena
 * logo, lokasi, jurusan, IPK, dan deskripsi semuanya opsional di database.
 */
export function EducationCard({ item }: { item: Education }) {
  const ipk = formatIpk(item.gpa);
  const rentang = formatRentangTahun(item.start_year, item.end_year);

  // Tanpa tahun selesai berarti jenjang ini masih berjalan. Itu disimpulkan
  // dari datanya, bukan dari kolom status tersendiri yang bisa tidak sinkron.
  const masihBerjalan = item.end_year === null;

  // Baris judul memakai jenjang dan jurusan bila ada, karena itulah yang
  // dicari orang lebih dulu. Kalau keduanya kosong, nama institusi naik
  // menjadi judul supaya kartu tidak pernah tampil tanpa judul.
  const judul = [item.degree, item.major].filter(Boolean).join(" · ");
  const adaJudul = judul !== "";

  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <LogoInstitusi logoUrl={item.logo_url} nama={item.institution} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {masihBerjalan ? (
              <Badge tone="accent">● Sedang ditempuh</Badge>
            ) : null}
            {ipk ? <Badge>IPK {ipk}</Badge> : null}
          </div>

          <h2
            className={`font-heading text-lg font-bold text-text sm:text-xl ${
              masihBerjalan || ipk ? "mt-3" : ""
            }`}
          >
            {adaJudul ? judul : item.institution}
          </h2>

          {adaJudul ? (
            <p className="mt-1 font-medium text-accent">{item.institution}</p>
          ) : null}

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-text-muted">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Periode</dt>
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <dd>{rentang}</dd>
            </div>

            {item.location ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Lokasi</dt>
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <dd>{item.location}</dd>
              </div>
            ) : null}
          </dl>

          {item.description ? (
            <p className="prosa mt-4 text-sm leading-relaxed text-text-muted">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/**
 * Logo institusi, atau inisialnya bila logo belum diunggah.
 *
 * Jalur inisial memakai ukuran yang sama persis dengan jalur gambar, sehingga
 * daftar yang sebagian institusinya sudah punya logo tetap sejajar.
 */
function LogoInstitusi({
  logoUrl,
  nama,
}: {
  logoUrl: string | null;
  nama: string;
}) {
  const kelas =
    "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border-subtle bg-surface-sunken sm:size-16";

  if (logoUrl) {
    return (
      <div className={kelas}>
        <Image
          src={logoUrl}
          // Nama institusinya sudah tertulis sebagai teks di kartu yang sama,
          // jadi logo di sini bersifat hiasan dan tidak perlu diumumkan ulang.
          alt=""
          width={64}
          height={64}
          className="size-full object-contain p-1.5"
        />
      </div>
    );
  }

  const inisial = nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={kelas} aria-hidden="true">
      <span className="font-heading text-lg font-bold text-text-subtle">
        {inisial || "?"}
      </span>
    </div>
  );
}
