"use client";

import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

export function PdfPages({ url }: { url: string }) {
  const [dokumen, setDokumen] = useState<PDFDocumentProxy>();
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let dibatalkan = false;
    let tugas: PDFDocumentLoadingTask | undefined;

    async function muat() {
      try {
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        if (dibatalkan) return;

        GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).href;
        tugas = getDocument({ url });
        const pdf = await tugas.promise;
        if (!dibatalkan) setDokumen(pdf);
      } catch {
        if (!dibatalkan) setGagal(true);
      }
    }

    void muat();
    return () => {
      dibatalkan = true;
      void tugas?.destroy().catch(() => {});
    };
  }, [url]);

  if (gagal) {
    return (
      <p role="status" className="p-8 text-center text-sm text-text-muted">
        Pratinjau CV gagal dimuat. Buka PDF di tab baru atau unduh CV dari tombol di atas.
      </p>
    );
  }

  if (!dokumen) {
    return <p role="status" className="p-8 text-center text-sm text-text-muted">Memuat CV…</p>;
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: dokumen.numPages }, (_, index) => (
        <HalamanPdf key={index} dokumen={dokumen} nomor={index + 1} />
      ))}
    </div>
  );
}

function HalamanPdf({ dokumen, nomor }: { dokumen: PDFDocumentProxy; nomor: number }) {
  const kanvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"menunggu" | "siap" | "gagal">("menunggu");

  useEffect(() => {
    const kanvas = kanvasRef.current;
    if (!kanvas) return;
    let dibatalkan = false;
    let tugas: RenderTask | undefined;

    async function renderHalaman(kanvas: HTMLCanvasElement) {
      try {
        const halaman = await dokumen.getPage(nomor);
        if (dibatalkan) return;

        const asli = halaman.getViewport({ scale: 1 });
        const lebar = kanvas.clientWidth * window.devicePixelRatio;
        const skala = Math.min(lebar / asli.width, 2400 / Math.max(asli.width, asli.height));
        const viewport = halaman.getViewport({ scale: skala });
        kanvas.width = Math.ceil(viewport.width);
        kanvas.height = Math.ceil(viewport.height);
        tugas = halaman.render({ canvas: kanvas, viewport });
        await tugas.promise;
        halaman.cleanup();
        if (!dibatalkan) setStatus("siap");
      } catch {
        if (!dibatalkan) setStatus("gagal");
      }
    }

    const pengamat = new IntersectionObserver((entri) => {
      if (!entri.some((e) => e.isIntersecting)) return;
      pengamat.disconnect();
      if (!dibatalkan) void renderHalaman(kanvas);
    }, { rootMargin: "300px" });
    pengamat.observe(kanvas);

    return () => {
      dibatalkan = true;
      pengamat.disconnect();
      tugas?.cancel();
    };
  }, [dokumen, nomor]);

  if (status === "gagal") {
    return <p role="status" className="p-6 text-center text-sm text-text-muted">Halaman {nomor} gagal ditampilkan.</p>;
  }

  return (
    <canvas
      ref={kanvasRef}
      role="img"
      aria-label={`Halaman ${nomor} dari ${dokumen.numPages}`}
      className={status === "siap" ? "block h-auto w-full" : "block aspect-[1/1.414] w-full bg-surface-raised"}
    />
  );
}
