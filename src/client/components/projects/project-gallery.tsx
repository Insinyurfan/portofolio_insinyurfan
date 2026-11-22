"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { Modal } from "@/client/components/ui/modal";
import { Reveal } from "@/client/components/ui/reveal";

export function ProjectGallery({ gambar, judul }: { gambar: string[]; judul: string }) {
  const [pilihan, setPilihan] = useState<{ src: string; nomor: number } | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const tutup = useCallback(() => setPilihan(null), []);

  return (
    <>
      <ul className="grid list-none gap-4 sm:grid-cols-2">
        {gambar.map((src, index) => (
          <Reveal as="li" key={`${index}-${src}`}>
            <button
              type="button"
              aria-label={`Perbesar foto ${index + 1} proyek ${judul}`}
              aria-haspopup="dialog"
              onClick={(event) => {
                pemicuRef.current = event.currentTarget;
                setPilihan({ src, nomor: index + 1 });
              }}
              className="group relative block aspect-16/10 w-full cursor-zoom-in overflow-hidden rounded-card border border-border-subtle bg-surface-sunken transition-colors hover:border-accent"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 639px) 100vw, 50vw"
                className="object-contain"
              />
              <span className="absolute right-3 bottom-3 rounded-pill border border-border-subtle bg-surface-raised p-2 text-text shadow-card group-hover:text-accent">
                <Maximize2 className="size-4" aria-hidden="true" />
              </span>
            </button>
          </Reveal>
        ))}
      </ul>

      <Modal
        terbuka={pilihan !== null}
        onTutup={tutup}
        pemicuRef={pemicuRef}
        judul={`${judul} · Foto ${pilihan?.nomor ?? 1} dari ${gambar.length}`}
        className="max-w-[82rem]"
        classNameIsi="bg-surface-sunken p-2 sm:p-3"
      >
        {pilihan !== null ? (
          <div className="relative h-[68dvh]">
            <Image
              src={pilihan.src}
              alt={`Foto ${pilihan.nomor} proyek ${judul}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
