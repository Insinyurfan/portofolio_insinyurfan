"use client";

import { ArrowUpRight, Award, Building2, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { PdfCover, PdfPages } from "@/client/components/public/pdf-pages";
import { Modal } from "@/client/components/ui/modal";
import { Badge, ButtonExternal } from "@/client/components/ui/primitives";
import { cn } from "@/shared/cn";
import { formatTanggal } from "@/shared/format";
import { daftarKategori, kategoriSertifikat, kunciKategori, logoOtomatisPenerbit } from "@/shared/sertifikat";
import type { Achievement } from "@/shared/types";

export function AchievementGrid({
  achievements,
  denganFilter = false,
}: {
  achievements: Achievement[];
  denganFilter?: boolean;
}) {
  const [filter, setFilter] = useState("");
  const [aktif, setAktif] = useState<Achievement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement>(null);
  const tutup = useCallback(() => setAktif(null), []);

  const kategori = daftarKategori(achievements.map(kategoriSertifikat));
  const terlihat = filter
    ? achievements.filter((item) => kunciKategori(kategoriSertifikat(item)) === filter)
    : achievements;

  return (
    <>
      {denganFilter ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <label className="block min-w-0 text-sm font-semibold text-text">
            Kategori sertifikat
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-2 block max-w-full rounded-card border border-border-strong bg-surface-raised px-4 py-2.5 font-medium text-text"
            >
              <option value="">Semua kategori</option>
              {kategori.map((label) => (
                <option key={kunciKategori(label)} value={kunciKategori(label)}>{label}</option>
              ))}
            </select>
          </label>
          <p role="status" className="text-sm text-text-muted">{terlihat.length} sertifikat</p>
        </div>
      ) : null}

      <ul className="grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {terlihat.map((item) => {
          const Ikon = item.pdf_url ? FileText : Award;
          return (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={(event) => {
                  pemicuRef.current = event.currentTarget;
                  setAktif(item);
                }}
                className="group flex h-full w-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-raised text-left shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="flex w-full flex-1 items-start gap-3 p-4 sm:p-5">
                  <LogoPenerbit item={item} />
                  <span className="flex min-w-0 flex-col items-start gap-1.5">
                    <span className="block font-heading font-bold text-text [overflow-wrap:anywhere]">{item.title}</span>
                    {item.issuer ? <span className="block text-sm font-medium text-text-muted [overflow-wrap:anywhere]">{item.issuer}</span> : null}
                    <Badge tone="accent">{kategoriSertifikat(item)}</Badge>
                  </span>
                </span>
                <span aria-hidden="true" className="relative grid h-44 w-full shrink-0 place-items-center border-y border-border-subtle bg-surface-sunken">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, (max-width: 1535px) 33vw, 25vw"
                      className="object-contain"
                    />
                  ) : (
                    <>
                      <Ikon className="size-8 text-text-muted" />
                      {item.pdf_url ? <PdfCover key={item.pdf_url} url={item.pdf_url} /> : null}
                    </>
                  )}
                </span>
                <span className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                  {item.issued_date ? (
                    <span className="text-xs text-text-muted sm:text-sm">{formatTanggal(item.issued_date)}</span>
                  ) : null}
                  <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:underline">
                    {item.pdf_url || item.image_url ? "Lihat sertifikat" : "Lihat detail"}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Modal
        terbuka={aktif !== null}
        onTutup={tutup}
        pemicuRef={pemicuRef}
        judul={aktif?.title}
        label={aktif ? kategoriSertifikat(aktif) : undefined}
        lebar="lebar"
        isiBisaDifokuskan={!!aktif?.pdf_url}
        aksi={aktif?.pdf_url ? (
          <a
            href={aktif.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka PDF di tab baru"
            className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
          >
            PDF <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      >
        {aktif ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <LogoPenerbit item={aktif} />
                <div className="min-w-0">
                  {aktif.issuer ? <p className="font-semibold text-text [overflow-wrap:anywhere]">{aktif.issuer}</p> : null}
                  {aktif.issued_date ? <p className="text-sm text-text-muted">{formatTanggal(aktif.issued_date)}</p> : null}
                </div>
              </div>
              {aktif.verification_url ? (
                <ButtonExternal href={aktif.verification_url}>Verifikasi sertifikat</ButtonExternal>
              ) : null}
            </div>

            {aktif.pdf_url ? (
              <div className="bg-surface-sunken p-2">
                <PdfPages key={aktif.pdf_url} url={aktif.pdf_url} label="sertifikat" />
              </div>
            ) : aktif.image_url ? (
              <div className="relative h-[58dvh] overflow-hidden rounded-card bg-surface-sunken">
                <Image
                  src={aktif.image_url}
                  alt={`Sertifikat ${aktif.title}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <p className="text-sm text-text-muted">Berkas sertifikat belum tersedia.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function LogoPenerbit({ item }: { item: Achievement }) {
  const otomatis = item.issuer_logo_url ? null : logoOtomatisPenerbit(item.issuer);
  const logo = item.issuer_logo_url || otomatis?.url;
  const [gagal, setGagal] = useState<string | null>(null);

  if (logo && gagal !== logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={64}
        height={64}
        className={cn(
          "size-14 shrink-0 rounded-xl border border-border-subtle object-contain p-1.5 sm:size-16",
          otomatis?.latarGelap ? "bg-logo-background-inverse" : "bg-logo-background",
        )}
        onError={() => setGagal(logo)}
      />
    );
  }

  return (
    <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl border border-border-subtle bg-accent-soft text-accent-soft-text sm:size-16">
      <Building2 className="size-6" />
    </span>
  );
}
