"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { cn } from "@/shared/cn";

/**
 * Foto profil di hero beranda, dengan navigasi bila fotonya lebih dari satu.
 *
 * TIDAK berputar sendiri. Carousel yang berganti otomatis memindahkan isi
 * tepat saat orang sedang membacanya, dan tidak ada cara menghentikannya
 * selain menunggu — itu juga melanggar harapan pengguna yang menyalakan
 * reduced motion. Perpindahan di sini selalu atas perintah pengunjung.
 *
 * Semua foto tetap ada di DOM dan yang tidak aktif disembunyikan, sehingga
 * berpindah tidak memicu pemuatan gambar baru dan terasa seketika.
 */
export function ProfileCarousel({
  photos,
  fullName,
  priority = false,
}: {
  photos: string[];
  fullName: string;
  priority?: boolean;
}) {
  const [aktif, setAktif] = useState(0);
  const idDasar = useId();

  if (photos.length === 0) return null;

  const banyak = photos.length > 1;

  function geser(arah: -1 | 1) {
    setAktif((kini) => (kini + arah + photos.length) % photos.length);
  }

  return (
    <div className="shrink-0">
      <div
        className="relative overflow-hidden rounded-card-lg border border-border-subtle bg-surface-sunken"
        // Diumumkan sebagai area yang isinya berganti, supaya pembaca layar
        // membacakan foto baru setelah tombol ditekan.
        aria-roledescription={banyak ? "carousel" : undefined}
        aria-label={banyak ? `Foto ${fullName}` : undefined}
      >
        {photos.map((src, index) => (
          <div
            key={src}
            id={`${idDasar}-foto-${index}`}
            hidden={index !== aktif}
            aria-roledescription={banyak ? "slide" : undefined}
            aria-label={banyak ? `Foto ${index + 1} dari ${photos.length}` : undefined}
          >
            <Image
              src={src}
              alt={`Foto ${fullName}${banyak ? ` (${index + 1})` : ""}`}
              width={480}
              height={600}
              // Hanya foto pertama yang diprioritaskan; sisanya tidak terlihat
              // saat halaman dibuka, jadi tidak perlu ikut menahan render.
              priority={priority && index === 0}
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 18rem, 70vw"
              className="size-full object-cover"
            />
          </div>
        ))}

        {banyak ? (
          <>
            <TombolGeser arah="kiri" onClick={() => geser(-1)} />
            <TombolGeser arah="kanan" onClick={() => geser(1)} />
          </>
        ) : null}
      </div>

      {banyak ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setAktif(index)}
              aria-label={`Tampilkan foto ${index + 1}`}
              aria-current={index === aktif ? "true" : undefined}
              className={cn(
                "h-2 rounded-pill transition-all",
                index === aktif
                  ? "w-6 bg-accent"
                  : "w-2 bg-border-strong hover:bg-accent",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TombolGeser({
  arah,
  onClick,
}: {
  arah: "kiri" | "kanan";
  onClick: () => void;
}) {
  const Ikon = arah === "kiri" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kiri" ? "Foto sebelumnya" : "Foto berikutnya"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-pill border border-border-subtle bg-surface-raised/90 text-text shadow-card backdrop-blur transition-colors hover:bg-surface-raised",
        arah === "kiri" ? "left-3" : "right-3",
      )}
    >
      <Ikon className="size-4" aria-hidden="true" />
    </button>
  );
}
