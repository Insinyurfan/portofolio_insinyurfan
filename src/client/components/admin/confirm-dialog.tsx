"use client";

import { useCallback, useEffect, useRef } from "react";

import { Button } from "@/client/components/admin/ui";

/**
 * Dialog konfirmasi untuk tindakan merusak.
 *
 * Memenuhi syarat spesifikasi: dapat dibatalkan lewat tombol batal, Escape,
 * dan klik di luar dialog; fokus terkurung selama terbuka; dan setelah ditutup
 * fokus kembali ke kontrol yang membukanya.
 */
export function ConfirmDialog({
  terbuka,
  judul,
  keterangan,
  labelKonfirmasi = "Hapus",
  sedangBerjalan = false,
  onKonfirmasi,
  onBatal,
}: {
  terbuka: boolean;
  judul: string;
  /** Sebutkan akibat turunan di sini, misalnya keahlian yang ikut terhapus. */
  keterangan: string;
  labelKonfirmasi?: string;
  sedangBerjalan?: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const pemicuRef = useRef<Element | null>(null);

  const tutup = useCallback(() => {
    onBatal();
  }, [onBatal]);

  // Ingat kontrol yang membuka dialog, supaya fokus bisa dikembalikan.
  useEffect(() => {
    if (terbuka) {
      pemicuRef.current = document.activeElement;
    } else if (pemicuRef.current instanceof HTMLElement) {
      pemicuRef.current.focus();
      pemicuRef.current = null;
    }
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;

    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
        "button:not([disabled]), a[href]",
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
  }, [terbuka, tutup]);

  if (!terbuka) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-adm-overlay p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) tutup();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="judul-konfirmasi"
        aria-describedby="keterangan-konfirmasi"
        className="w-full max-w-md rounded-adm border border-adm-border bg-adm-panel p-5 shadow-lg"
      >
        <h2 id="judul-konfirmasi" className="text-base font-bold text-adm-fg">
          {judul}
        </h2>
        <p id="keterangan-konfirmasi" className="mt-2 text-sm text-adm-fg-muted">
          {keterangan}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={tutup} disabled={sedangBerjalan}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={onKonfirmasi}
            disabled={sedangBerjalan}
          >
            {sedangBerjalan ? "Memproses…" : labelKonfirmasi}
          </Button>
        </div>
      </div>
    </div>
  );
}
