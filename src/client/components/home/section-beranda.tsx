import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Satu bagian di beranda satu-halaman.
 *
 * Setiap bagian punya `id` supaya dapat ditautkan langsung
 * (`/#pendidikan`), dan `aria-labelledby` yang menunjuk judulnya — tanpa itu
 * pembaca layar hanya mengumumkan "region" tanpa menyebut bagian apa.
 *
 * Judulnya `<h2>`: beranda sudah punya satu `<h1>` di hero, dan menambah
 * `<h1>` kedua membuat struktur dokumen menyesatkan.
 */
export function SectionBeranda({
  id,
  eyebrow,
  judul,
  deskripsi,
  tautan,
  children,
}: {
  id: string;
  eyebrow?: string;
  judul: string;
  deskripsi?: string;
  /** Tautan ke halaman penuh bagian ini, misalnya "Lihat semua". */
  tautan?: { href: string; label: string };
  children: ReactNode;
}) {
  const idJudul = `${id}-judul`;

  return (
    <section
      id={id}
      aria-labelledby={idJudul}
      className="border-t border-border-subtle py-12 sm:py-16"
      // Tautan sesama halaman tidak boleh mendarat tepat di bawah navbar yang
      // menempel di atas, sehingga judul bagiannya tertutup.
      style={{ scrollMarginTop: "5rem" }}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={idJudul} className="font-heading text-2xl font-bold text-text sm:text-3xl">
            {judul}
          </h2>
          {deskripsi ? (
            <p className="prosa mt-2 text-sm text-text-muted sm:text-base">
              {deskripsi}
            </p>
          ) : null}
        </div>

        {tautan ? (
          <Link
            href={tautan.href}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border-subtle px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {tautan.label}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}
