"use client";

import { Download, ExternalLink, Eye, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pratinjau CV di modal.
 *
 * PDF disematkan lewat elemen bawaan peramban, bukan pustaka penampil: yang
 * dibutuhkan hanya menampilkan satu berkas, dan pustaka penampil PDF akan
 * masuk ke bundel beranda demi tombol yang mungkin tidak pernah ditekan.
 *
 * URL PDF baru dipasang SETELAH modal dibuka, sehingga berkasnya belum
 * diunduh pada pemuatan pertama beranda.
 */
export function CvPreview({
  cvUrl,
  namaPemilik,
}: {
  cvUrl: string;
  namaPemilik: string;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [gagalMuat, setGagalMuat] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);

  const tutup = useCallback(() => setTerbuka(false), []);

  /**
   * Fokus kembali ke tombol pembuka SETELAH modal pernah dibuka.
   *
   * Penjaga `pernahTerbuka` wajib: tanpa itu efek ini ikut berjalan saat
   * komponen pertama kali dipasang dan langsung merebut fokus ke tombol
   * "Pratinjau CV" begitu beranda dimuat — pengguna keyboard mendarat di
   * tengah halaman tanpa menekan apa pun.
   */
  const pernahTerbuka = useRef(false);
  useEffect(() => {
    if (terbuka) {
      pernahTerbuka.current = true;
      return;
    }
    if (pernahTerbuka.current) pemicuRef.current?.focus();
  }, [terbuka]);

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
        tutup();
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
  }, [terbuka, tutup]);

  // Berkas diperiksa hanya saat modal dibuka, supaya beranda tidak menanggung
  // permintaan tambahan pada pemuatan pertama.
  useEffect(() => {
    if (!terbuka) return;
    let dibatalkan = false;

    fetch(cvUrl, { method: "HEAD" })
      .then((r) => {
        if (!dibatalkan && !r.ok) setGagalMuat(true);
      })
      .catch(() => {
        if (!dibatalkan) setGagalMuat(true);
      });

    return () => {
      dibatalkan = true;
    };
  }, [terbuka, cvUrl]);

  return (
    <>
      <button
        ref={pemicuRef}
        type="button"
        onClick={() => setTerbuka(true)}
        className="inline-flex items-center justify-center gap-2 rounded-pill border border-border-strong px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
      >
        <Eye className="size-4" aria-hidden="true" />
        Pratinjau CV
      </button>

      {terbuka ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) tutup();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau CV ${namaPemilik}`}
            className="flex h-full max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-raised"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4">
              <h2 className="font-heading font-bold text-text">
                CV {namaPemilik}
              </h2>

              <div className="flex items-center gap-2">
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-accent hover:text-accent"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Buka di tab baru
                </a>

                <a
                  href={cvUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Unduh
                </a>

                <button
                  type="button"
                  onClick={tutup}
                  aria-label="Tutup pratinjau CV"
                  className="inline-flex size-8 items-center justify-center rounded-pill border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-surface-sunken">
              {gagalMuat ? (
                <Cadangan
                  cvUrl={cvUrl}
                  pesan="Berkas CV tidak dapat dimuat saat ini. Coba buka di tab baru atau unduh berkasnya."
                />
              ) : (
                // Isi di dalam <object> adalah jalur cadangan bawaan peramban:
                // ia tampil ketika peramban tidak dapat merender PDF inline,
                // termasuk di sebagian besar peramban seluler.
                <object
                  data={cvUrl}
                  type="application/pdf"
                  className="h-full w-full"
                  aria-label={`Dokumen CV ${namaPemilik}`}
                >
                  <Cadangan
                    cvUrl={cvUrl}
                    pesan="Peramban Anda tidak dapat menampilkan PDF di dalam halaman."
                  />
                </object>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Jalur cadangan: selalu menyediakan cara mencapai berkasnya. */
function Cadangan({ cvUrl, pesan }: { cvUrl: string; pesan: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="max-w-sm text-sm text-text-muted">{pesan}</p>

      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Buka di tab baru
        </a>

        <a
          href={cvUrl}
          download
          className="inline-flex items-center gap-2 rounded-pill border border-border-strong px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
        >
          <Download className="size-4" aria-hidden="true" />
          Unduh CV
        </a>
      </div>
    </div>
  );
}
