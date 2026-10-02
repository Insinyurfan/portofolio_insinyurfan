"use client";

import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/primitives";
import { formatTanggal, labelAchievementCategory } from "@/lib/format";
import type { Achievement } from "@/lib/types";

/**
 * Grid pencapaian beserta preview gambar.
 *
 * Preview memenuhi syarat spesifikasi: ditutup lewat tombol tutup, Escape, dan
 * klik di luar; fokus terkurung di dalamnya selama terbuka; dan fokus kembali
 * ke kartu asal setelah ditutup.
 */
export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const [aktif, setAktif] = useState<Achievement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const tutup = useCallback(() => {
    setAktif(null);
    pemicuRef.current?.focus();
    pemicuRef.current = null;
  }, []);

  function buka(achievement: Achievement, pemicu: HTMLButtonElement) {
    pemicuRef.current = pemicu;
    setAktif(achievement);
  }

  // Escape menutup; Tab dikurung di dalam dialog.
  useEffect(() => {
    if (!aktif) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        tutup();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const fokusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (fokusable.length === 0) return;

      const pertama = fokusable[0];
      const terakhir = fokusable[fokusable.length - 1];
      if (!pertama || !terakhir) return;

      if (event.shiftKey && document.activeElement === pertama) {
        event.preventDefault();
        terakhir.focus();
      } else if (!event.shiftKey && document.activeElement === terakhir) {
        event.preventDefault();
        pertama.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [aktif, tutup]);

  // Fokus masuk ke dialog, dan halaman di belakang tidak ikut ter-scroll.
  useEffect(() => {
    if (!aktif) return;

    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = sebelumnya;
    };
  }, [aktif]);

  return (
    <>
      <ul className="bento-grid list-none">
        {achievements.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={(event) => buka(item, event.currentTarget)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-raised text-left shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-sunken">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={`Gambar pencapaian ${item.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <span className="font-heading text-sm font-semibold text-text-subtle">
                      Tanpa gambar
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <Badge tone="accent">{labelAchievementCategory(item.category)}</Badge>

                <h2 className="mt-3 font-heading text-base font-bold text-text">
                  {item.title}
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                  {[item.issuer, item.issued_date ? formatTanggal(item.issued_date) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                <span className="mt-4 text-sm font-semibold text-accent">
                  Lihat pratinjau
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {aktif ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(event) => {
            // Klik di area luar menutup preview.
            if (event.target === event.currentTarget) tutup();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau pencapaian: ${aktif.title}`}
            className="max-h-full w-full max-w-2xl overflow-auto rounded-card border border-border-subtle bg-surface-raised p-4 shadow-card-hover sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-bold text-text">
                  {aktif.title}
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  {[
                    labelAchievementCategory(aktif.category),
                    aktif.issuer,
                    aktif.issued_date ? formatTanggal(aktif.issued_date) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <button
                type="button"
                onClick={tutup}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent"
                aria-label="Tutup pratinjau"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="relative mt-4 aspect-4/3 w-full overflow-hidden rounded-card bg-surface-sunken">
              {aktif.image_url ? (
                <Image
                  src={aktif.image_url}
                  alt={`Gambar pencapaian ${aktif.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6 text-center">
                  <p className="text-sm text-text-muted">
                    Pencapaian ini belum memiliki gambar.
                  </p>
                </div>
              )}
            </div>

            {aktif.verification_url ? (
              <a
                href={aktif.verification_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Verifikasi pencapaian
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
