"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/shared/cn";

/**
 * Dialog bersama untuk seluruh situs publik.
 *
 * Logika yang dulu disalin di setiap modal dikumpulkan di sini: kurungan
 * fokus, Escape untuk menutup, penguncian scroll halaman di belakang, dan
 * pengembalian fokus ke pemicunya. Menyalinnya berarti setiap perbaikan
 * aksesibilitas harus diingat di beberapa tempat sekaligus — dan yang
 * terlewat tidak akan terlihat sampai ada yang mengujinya dengan keyboard.
 *
 * Pemanggil yang menyediakan elemen pemicunya sendiri meneruskan `pemicuRef`,
 * supaya fokus kembali ke sana setelah ditutup. Tanpa itu, pengguna keyboard
 * terlempar ke awal halaman.
 */
export function Modal({
  terbuka,
  onTutup,
  judul,
  label,
  pemicuRef,
  lebar = "sedang",
  children,
}: {
  terbuka: boolean;
  onTutup: () => void;
  /** Judul yang terlihat; sekaligus menjadi nama dialognya. */
  judul: string;
  /** Label kecil di atas judul, misalnya "Riwayat pendidikan". */
  label?: string;
  pemicuRef?: React.RefObject<HTMLElement | null>;
  lebar?: "sedang" | "lebar";
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // useId, BUKAN Math.random: nilainya harus sama antara render di server
  // dan di peramban, kalau tidak hydration gagal — dan ia stabil di setiap
  // render ulang, sehingga aria-labelledby tidak pernah menunjuk id usang.
  const idJudul = useId();

  // Fokus kembali ke pemicunya setelah ditutup.
  useEffect(() => {
    if (!terbuka) pemicuRef?.current?.focus();
  }, [terbuka, pemicuRef]);

  useEffect(() => {
    if (!terbuka) return;

    dialogRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    // Halaman di belakang tidak ikut ter-scroll, dan posisi scroll-nya tetap
    // setelah modal ditutup.
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onTutup();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const fokusable = dialog.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = sebelumnya;
    };
  }, [terbuka, onTutup]);

  if (!terbuka) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      // Klik di luar kotak menutup dialog, klik di dalamnya tidak.
      onClick={(event) => {
        if (event.target === event.currentTarget) onTutup();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-raised shadow-card-hover",
          lebar === "lebar" ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle p-5 sm:p-6">
          <div className="min-w-0">
            {label ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
                {label}
              </p>
            ) : null}
            <h2
              id={idJudul}
              className="mt-1 font-heading text-xl font-bold text-text sm:text-2xl"
            >
              {judul}
            </h2>
          </div>

          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="shrink-0 rounded-pill border border-border-subtle p-2 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
