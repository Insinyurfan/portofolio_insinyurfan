"use client";

import { Download, ExternalLink, Eye } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { PdfPages } from "@/client/components/public/pdf-pages";
import { Modal } from "@/client/components/ui/modal";
import { cn } from "@/shared/cn";

const tombol =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-pill px-3 text-sm font-semibold transition-colors";
const tombolGaris = "border border-border-subtle text-text hover:border-accent hover:text-accent";

export function CvActions({
  cvUrl,
  namaPemilik,
  ringkas = false,
  onPratinjau,
  kembaliFokusKe,
}: {
  cvUrl: string;
  namaPemilik: string;
  ringkas?: boolean;
  onPratinjau?: () => void;
  kembaliFokusKe?: React.RefObject<HTMLElement | null>;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef<HTMLButtonElement>(null);
  const tutup = useCallback(() => setTerbuka(false), []);

  const namaFile = `CV ${namaPemilik}.pdf`;
  const urlUnduh = new URL(cvUrl);
  // Storage menyajikan berkas lintas origin dengan Content-Disposition attachment.
  if (urlUnduh.pathname.startsWith("/storage/v1/object/public/")) {
    urlUnduh.searchParams.set("download", namaFile);
  }

  return (
    <>
      <div
        role="group"
        aria-label="Curriculum Vitae"
        className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-border-subtle bg-surface-sunken/60 p-1"
      >
        <button
          ref={pemicuRef}
          type="button"
          aria-label="Pratinjau CV"
          aria-haspopup="dialog"
          onClick={() => {
            onPratinjau?.();
            setTerbuka(true);
          }}
          className={cn(tombol, tombolGaris, "bg-surface-raised")}
        >
          {ringkas ? "CV" : "Pratinjau CV"}
          <Eye className="size-4" aria-hidden="true" />
        </button>
        <a
          href={urlUnduh.href}
          download={namaFile}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Unduh CV"
          className={cn(tombol, "bg-accent text-accent-contrast hover:bg-accent-hover")}
        >
          {ringkas ? "Unduh" : "Unduh CV"}
          <Download className="size-4" aria-hidden="true" />
        </a>
      </div>

      <Modal
        terbuka={terbuka}
        onTutup={tutup}
        pemicuRef={kembaliFokusKe ?? pemicuRef}
        judul={<>Pratinjau CV<span className="sr-only"> {namaPemilik}</span></>}
        className="h-[90dvh] max-w-[80rem]"
        classNameIsi="bg-surface-sunken p-2 sm:p-3"
        isiBisaDifokuskan
        aksi={
          <>
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buka PDF di tab baru"
              className={cn(tombol, tombolGaris)}
            >
              PDF <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
            <a
              href={urlUnduh.href}
              download={namaFile}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Unduh CV"
              className={cn(tombol, tombolGaris, "px-2.5")}
            >
              <span className="hidden sm:inline">Unduh</span>
              <Download className="size-4" aria-hidden="true" />
            </a>
          </>
        }
      >
        {terbuka ? <PdfPages key={cvUrl} url={cvUrl} /> : null}
      </Modal>
    </>
  );
}
