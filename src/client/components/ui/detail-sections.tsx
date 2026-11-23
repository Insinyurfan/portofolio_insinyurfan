import { ExternalLink, Maximize2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { gayaFoto, type FokusGaleri } from "@/shared/fokus-galeri";

/**
 * Bagian-bagian isi dialog detail, dipakai bersama oleh pendidikan dan
 * pengalaman.
 *
 * Semuanya mengembalikan `null` saat datanya kosong. Itu disengaja: pemanggil
 * tidak perlu menulis pemeriksaan kosong berulang kali, dan dialog tidak
 * pernah menampilkan judul bagian yang di bawahnya tidak ada apa-apa.
 */

/** Daftar poin bernomor titik, misalnya "Fokus Pembelajaran". */
export function DaftarPoin({
  judul,
  ikon,
  items,
}: {
  judul: string;
  ikon?: ReactNode;
  items: string[];
}) {
  const bersih = items.map((i) => i.trim()).filter((i) => i !== "");
  if (bersih.length === 0) return null;

  return (
    <section className="mt-6 first:mt-0">
      <h3 className="flex items-center gap-2 border-b border-border-subtle pb-3 font-heading text-base font-bold text-text">
        {ikon}
        {judul}
      </h3>
      <ul className="mt-3 space-y-2">
        {bersih.map((isi, index) => (
          <li
            key={`${index}-${isi.slice(0, 16)}`}
            className="flex gap-2.5 text-sm leading-relaxed text-text-muted"
          >
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-pill bg-accent" />
            <span>{isi}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Galeri foto dokumentasi. */
export function GaleriDetail({
  judul,
  gambar,
  alt,
  fokus,
}: {
  judul: string;
  gambar: string[];
  /** Keterangan konteks, dipakai menyusun alt tiap gambar. */
  alt: string;
  fokus?: FokusGaleri;
}) {
  if (gambar.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="border-b border-border-subtle pb-3 font-heading text-base font-bold text-text">
        {judul}
      </h3>
      <ul className="mt-3 grid list-none grid-cols-2 gap-3 sm:grid-cols-3">
        {gambar.map((src, index) => (
          <li key={`${index}-${src}`}>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka foto ${index + 1} ${alt} ukuran penuh di tab baru`}
              className="group relative block aspect-16/10 cursor-zoom-in overflow-hidden rounded-card border border-border-subtle bg-surface-sunken hover:border-accent"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 1024px) 33vw, 24rem"
                style={gayaFoto(fokus?.[src])}
              />
              <span className="absolute right-2 bottom-2 rounded-pill border border-border-subtle bg-surface-raised p-1.5 text-text group-hover:text-accent">
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Tombol ke situs resmi.
 *
 * Membuka di tab baru dengan `rel="noopener noreferrer"`: tanpa `noopener`,
 * halaman tujuan dapat mengakses `window.opener` dan mengarahkan ulang tab
 * asalnya.
 */
export function TombolKunjungi({
  url,
  label,
}: {
  url: string | null;
  label: string;
}) {
  if (!url) return null;

  return (
    <div className="mt-7 border-t border-border-subtle pt-5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
      >
        {label}
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
