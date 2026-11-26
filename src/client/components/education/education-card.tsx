"use client";

import { cn } from "@/shared/cn";
import { ArrowUpRight, BookOpen, CalendarDays, GraduationCap, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import {
  DaftarPoin,
  GaleriDetail,
  TombolKunjungi,
} from "@/client/components/ui/detail-sections";
import { Modal } from "@/client/components/ui/modal";
import { Badge, Card } from "@/client/components/ui/primitives";
import { formatIpk, formatRentangTahun, jenjangPerkuliahan } from "@/shared/format";
import type { Education } from "@/shared/types";

const FORMAT_NILAI = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export function EducationMark() {
  return (
    <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-card border border-border-subtle bg-accent-soft text-accent-soft-text sm:size-18">
      <GraduationCap className="size-8 sm:size-10" strokeWidth={1.6} />
    </span>
  );
}

export function EducationCard({ item }: { item: Education }) {
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const tutup = useCallback(() => setTerbuka(false), []);

  const kuliah = jenjangPerkuliahan(item.degree);
  const nilai = kuliah ? formatIpk(item.gpa) : item.gpa === null ? null : FORMAT_NILAI.format(item.gpa);
  const rentang = formatRentangTahun(item.start_year, item.end_year);

  // Tanpa tahun selesai berarti jenjang ini masih berjalan. Disimpulkan dari
  // datanya, bukan dari kolom status tersendiri yang bisa tidak sinkron.
  const masihBerjalan = item.end_year === null;

  // Baris judul memakai jenjang dan jurusan bila ada, karena itulah yang
  // dicari orang lebih dulu. Kalau keduanya kosong, nama institusi naik
  // menjadi judul supaya kartu tidak pernah tampil tanpa judul.
  const judul = [item.degree, item.major].filter(Boolean).join(" · ");
  const adaJudul = judul !== "";

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-card-hover">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <LogoInstitusi logoUrl={item.logo_url} nama={item.institution} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                <CalendarDays className="mr-1 size-3.5" aria-hidden="true" />
                {rentang}
              </Badge>
              {masihBerjalan ? <Badge tone="accent">● Sedang ditempuh</Badge> : null}
              {kuliah && nilai !== null ? <Badge>IPK {nilai}</Badge> : null}
            </div>

            <h2 className="mt-3 font-heading text-lg font-bold text-text sm:text-xl">
              {adaJudul ? judul : item.institution}
            </h2>

            {adaJudul ? (
              <p className="mt-1 font-medium text-accent">{item.institution}</p>
            ) : null}

            {item.location ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-text-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {item.location}
              </p>
            ) : null}

            {item.description ? (
              <p className="prosa mt-4 text-sm leading-relaxed text-text-muted">
                {item.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <CuplikanGaleri gambar={item.gallery} nama={item.institution} />
              <button
                ref={pemicuRef}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setTerbuka(true)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-pill text-sm font-semibold text-accent transition-colors after:absolute after:inset-0 after:rounded-card group-hover:text-accent-hover focus-visible:after:outline-2 focus-visible:after:outline-focus"
              >
                Buka detail
                <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only"> {item.institution}</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        terbuka={terbuka}
        onTutup={tutup}
        label="Riwayat pendidikan"
        judul={item.institution}
        pemicuRef={pemicuRef}
        lebar="lebar"
      >
        <div className="rounded-card border border-border-subtle bg-surface-sunken p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <LogoInstitusi logoUrl={item.logo_url} nama={item.institution} />
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold text-text">
                {adaJudul ? judul : item.institution}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                <Badge tone={masihBerjalan ? "accent" : "neutral"}>{rentang}</Badge>
                {item.location ? <Badge>{item.location}</Badge> : null}
                {nilai !== null ? <Badge>{kuliah ? "IPK" : "Nilai"} {nilai}</Badge> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {item.description ? (
            <p className="prosa text-sm leading-relaxed text-text-muted sm:text-base">{item.description}</p>
          ) : null}
          <DaftarPoin
            judul="Fokus Pembelajaran"
            ikon={<BookOpen className="size-4 text-accent" aria-hidden="true" />}
            items={item.focus_items}
          />
          <DaftarPoin
            judul="Aktivitas & Pencapaian"
            ikon={<Sparkles className="size-4 text-accent" aria-hidden="true" />}
            items={item.activity_items}
          />
          <GaleriDetail
            judul="Dokumentasi Pendidikan"
            gambar={item.gallery}
            alt={item.institution}
          />
          <TombolKunjungi url={item.website_url} label="Kunjungi situs institusi" />
        </div>
      </Modal>
    </>
  );
}

/** Tiga foto pertama sebagai cuplikan di kartu. */
function CuplikanGaleri({ gambar, nama }: { gambar: string[]; nama: string }) {
  if (gambar.length === 0) return null;

  return (
    <ul className="flex list-none items-center gap-2">
      {gambar.slice(0, 3).map((src, index) => (
        <li
          key={src}
          className="size-14 overflow-hidden rounded-card border border-border-subtle"
        >
          <Image
            src={src}
            alt={`${nama} — foto ${index + 1}`}
            width={112}
            height={112}
            className="size-full object-cover"
          />
        </li>
      ))}
      {gambar.length > 3 ? (
        <li className="text-xs font-medium text-text-subtle">
          +{gambar.length - 3} lagi
        </li>
      ) : null}
    </ul>
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
    "flex size-16 sm:size-18 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border-subtle";

  if (logoUrl) {
    return (
      <div className={cn(kelas, "bg-logo-background")}>
        <Image
          src={logoUrl}
          // Nama institusinya sudah tertulis sebagai teks di kartu yang sama,
          // jadi logo di sini bersifat hiasan dan tidak perlu diumumkan ulang.
          alt=""
          width={64}
          height={64}
          className="size-full object-contain p-1"
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
    <div className={cn(kelas, "bg-surface-sunken")} aria-hidden="true">
      <span className="font-heading text-lg font-bold text-text-subtle">
        {inisial || "?"}
      </span>
    </div>
  );
}
