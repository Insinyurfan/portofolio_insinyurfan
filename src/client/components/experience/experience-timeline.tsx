"use client";

import { cn } from "@/shared/cn";
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import {
  DaftarPoin,
  GaleriDetail,
  TombolKunjungi,
} from "@/client/components/ui/detail-sections";
import { Modal } from "@/client/components/ui/modal";
import { Badge } from "@/client/components/ui/primitives";
import { Reveal } from "@/client/components/ui/reveal";
import { formatRentangTanggal, labelExperienceType } from "@/shared/format";
import type { Experience } from "@/shared/types";

/**
 * Daftar pengalaman sebagai timeline bergaris.
 *
 * Garis dan titiknya dibangun sebagai KOLOM di samping kartu, bukan lewat
 * posisi absolut yang dihitung dari lebar padding induknya. Cara kedua terlihat
 * sama di satu ukuran layar lalu bergeser begitu padding berubah di breakpoint
 * berikutnya, dan pergeserannya hanya terlihat kalau kebetulan diperiksa.
 *
 * Kolom penanda disembunyikan di layar sempit: di sana ia hanya memakan ruang
 * baca tanpa menambah keterangan apa pun, karena urutannya sudah jelas dari
 * susunan kartunya.
 */
export function ExperienceTimeline({ items }: { items: Experience[] }) {
  return (
    <ol className="list-none">
      {items.map((item, index) => (
        <Reveal
          as="li"
          key={item.id}
          delay={index * 80}
          className="relative flex gap-4 pb-5 last:pb-0 sm:gap-6"
        >
          <div className="relative hidden w-3 shrink-0 sm:block" aria-hidden="true">
            {/* `ring` memakai warna latar halaman, sehingga titiknya tampak
             * memotong garis alih-alih menimpanya. */}
            <span className="absolute left-1/2 top-7 size-3 -translate-x-1/2 rounded-pill bg-accent ring-4 ring-surface" />
            {/* Garis berakhir di tepi bawah li — yang sudah memuat pb-5 —
             * sehingga menyambung ke titik item berikutnya tanpa celah.
             * Item terakhir tidak menggambarnya, supaya garisnya tidak
             * menggantung di bawah kartu penutup. */}
            {index < items.length - 1 ? (
              <span className="absolute bottom-0 left-1/2 top-10 w-px -translate-x-1/2 bg-border-subtle" />
            ) : null}
          </div>

          <KartuPengalaman item={item} />
        </Reveal>
      ))}
    </ol>
  );
}

function KartuPengalaman({ item }: { item: Experience }) {
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);

  const rentang = formatRentangTanggal(
    item.start_date,
    item.end_date,
    item.is_ongoing,
  );

  // Tombol detail hanya ditawarkan kalau memang ada yang bisa ditampilkan.
  // Dialog kosong lebih mengecewakan daripada tidak ada tombol sama sekali.
  const adaDetail =
    item.highlights.length > 0 ||
    item.gallery.length > 0 ||
    item.website_url !== null;

  return (
    <>
      <div className="min-w-0 flex-1 rounded-card border border-border-subtle bg-surface-raised p-5 shadow-card transition-shadow hover:shadow-card-hover sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="accent">{labelExperienceType(item.type)}</Badge>
          <p className="text-sm font-medium text-text-subtle">{rentang}</p>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-5">
          <LogoOrganisasi logoUrl={item.logo_url} nama={item.organization} />

          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold text-text sm:text-xl">
              {item.position}
            </h2>
            <p className="mt-1 font-medium text-accent">{item.organization}</p>

            {item.location ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {item.location}
              </p>
            ) : null}

            {item.description ? (
              <p className="prosa mt-3 text-sm leading-relaxed text-text-muted">
                {item.description}
              </p>
            ) : null}

            {adaDetail ? (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <CuplikanGaleri gambar={item.gallery} nama={item.organization} />

                <button
                  ref={pemicuRef}
                  type="button"
                  onClick={() => setTerbuka(true)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-pill text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                >
                  Buka detail
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  {/* Nama posisinya ikut disebut supaya pengguna pembaca layar
                      dapat membedakan tombol ini antar kartu. */}
                  <span className="sr-only"> {item.position}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {adaDetail ? (
        <Modal
          terbuka={terbuka}
          onTutup={() => setTerbuka(false)}
          label={labelExperienceType(item.type)}
          judul={item.position}
          pemicuRef={pemicuRef}
          lebar="lebar"
        >
          <div className="rounded-card border border-border-subtle bg-surface-sunken p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <LogoOrganisasi logoUrl={item.logo_url} nama={item.organization} />
              <div className="min-w-0">
                <p className="font-heading text-lg font-bold text-text">
                  {item.organization}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">
                    <CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" />
                    {rentang}
                  </Badge>
                  {item.location ? <Badge>{item.location}</Badge> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {item.description ? (
              <p className="prosa text-sm leading-relaxed text-text-muted">
                {item.description}
              </p>
            ) : null}

            <DaftarPoin
              judul="Kontribusi"
              ikon={<Sparkles className="size-4 text-accent" aria-hidden="true" />}
              items={item.highlights}
            />
            <GaleriDetail
              judul="Dokumentasi"
              gambar={item.gallery}
              alt={item.organization}
            />
            <TombolKunjungi url={item.website_url} label="Kunjungi situs organisasi" />
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

/** Logo organisasi, atau inisialnya bila logo belum diunggah. */
function LogoOrganisasi({
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
      // Ubin putih: latar putih pada logo menyatu dengannya, sehingga tidak
      // muncul kotak di dalam kotak.
      <div className={cn(kelas, "bg-surface-raised")}>
        <Image
          src={logoUrl}
          // Nama organisasinya sudah tertulis sebagai teks di kartu yang sama,
          // jadi logo di sini bersifat hiasan.
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
