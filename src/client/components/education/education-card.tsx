"use client";

import { BookOpen, CalendarDays, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import {
  DaftarPoin,
  GaleriDetail,
  TombolKunjungi,
} from "@/client/components/ui/detail-sections";
import { Modal } from "@/client/components/ui/modal";
import { Badge, Card } from "@/client/components/ui/primitives";
import { formatIpk, formatRentangTahun } from "@/shared/format";
import type { Education } from "@/shared/types";

/**
 * Satu kartu riwayat pendidikan, dengan dialog detail bila datanya ada.
 *
 * Setiap bagian yang nilainya kosong TIDAK dirender sama sekali — bukan
 * ditampilkan sebagai baris kosong atau tanda hubung. Riwayat yang hanya
 * memuat nama institusi dan tahun tetap menghasilkan kartu yang utuh, karena
 * logo, lokasi, jurusan, IPK, dan seluruh isi detail bersifat opsional.
 */
export function EducationCard({ item }: { item: Education }) {
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);

  const ipk = formatIpk(item.gpa);
  const rentang = formatRentangTahun(item.start_year, item.end_year);

  // Tanpa tahun selesai berarti jenjang ini masih berjalan. Disimpulkan dari
  // datanya, bukan dari kolom status tersendiri yang bisa tidak sinkron.
  const masihBerjalan = item.end_year === null;

  // Baris judul memakai jenjang dan jurusan bila ada, karena itulah yang
  // dicari orang lebih dulu. Kalau keduanya kosong, nama institusi naik
  // menjadi judul supaya kartu tidak pernah tampil tanpa judul.
  const judul = [item.degree, item.major].filter(Boolean).join(" · ");
  const adaJudul = judul !== "";

  // Tombol detail hanya ditawarkan kalau memang ada yang bisa ditampilkan.
  // Dialog kosong lebih mengecewakan daripada tidak ada tombol sama sekali.
  const adaDetail =
    item.focus_items.length > 0 ||
    item.activity_items.length > 0 ||
    item.gallery.length > 0 ||
    item.website_url !== null;

  return (
    <>
      <Card className="transition-shadow hover:shadow-card-hover">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <LogoInstitusi logoUrl={item.logo_url} nama={item.institution} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {masihBerjalan ? <Badge tone="accent">● Sedang ditempuh</Badge> : null}
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

            {adaDetail ? (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <CuplikanGaleri gambar={item.gallery} nama={item.institution} />

                <button
                  ref={pemicuRef}
                  type="button"
                  onClick={() => setTerbuka(true)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-pill text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                >
                  Buka detail
                  <span aria-hidden="true">↗</span>
                  {/* Nama institusinya ikut disebut supaya pengguna pembaca
                      layar dapat membedakan tombol ini antar kartu. */}
                  <span className="sr-only"> {item.institution}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {adaDetail ? (
        <Modal
          terbuka={terbuka}
          onTutup={() => setTerbuka(false)}
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
                  <Badge tone={masihBerjalan ? "accent" : "neutral"}>
                    {masihBerjalan ? "Sedang ditempuh" : rentang}
                  </Badge>
                  {item.location ? <Badge>{item.location}</Badge> : null}
                  {ipk ? <Badge>Nilai {ipk}</Badge> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
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
      ) : null}
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
