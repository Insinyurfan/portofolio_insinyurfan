import { ArrowDownRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/cn";

/**
 * Primitif bersama. Semuanya memakai token design system — tidak ada nilai
 * warna lepas di berkas ini maupun di komponen lain.
 */

/** Kartu bersudut membulat. `span` mengatur lebarnya di dalam bento grid. */
export function Card({
  children,
  className,
  span = 1,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
  as?: "div" | "article" | "li" | "section";
}) {
  const spanClass =
    span === 3
      ? "md:col-span-2 lg:col-span-3"
      : span === 2
        ? "md:col-span-2"
        : "";

  return (
    <As
      className={cn(
        "rounded-card border border-border-subtle bg-surface-raised p-5 shadow-card sm:p-6",
        spanClass,
        className,
      )}
    >
      {children}
    </As>
  );
}

/** Badge kecil, dipakai untuk tech stack, tipe, dan kategori. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium",
        tone === "accent"
          ? "bg-accent-soft text-accent-soft-text"
          : "bg-surface-sunken text-text-muted",
      )}
    >
      {children}
    </span>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-semibold transition-colors";

const BUTTON_VARIANT = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  outline:
    "border border-border-strong text-text hover:border-accent hover:text-accent",
} as const;

/** Tombol berbentuk tautan internal. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BUTTON_VARIANT;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], className)}>
      {children}
    </Link>
  );
}

/** Tombol berbentuk tautan eksternal; selalu membuka di tab baru. */
export function ButtonExternal({
  href,
  children,
  variant = "outline",
  className,
  ...rest
}: ComponentProps<"a"> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BUTTON_VARIANT;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], className)}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * Pembungkus halaman: blok pembuka, lalu isinya.
 *
 * Judul halaman hanya muncul SEKALI, yaitu di dalam blok pembuka. Sebelumnya
 * ada kepala bagian kedua di bawahnya yang mengulang label dan judul yang
 * sama persis — terbaca sebagai pengulangan, dan bagi pembaca layar
 * menghasilkan dua heading dengan isi identik.
 *
 * Isinya juga tidak lagi dibungkus panel berwarna. Kartu di dalam halaman
 * sudah menjadi kotaknya sendiri; wadah tambahan di sekelilingnya hanya
 * menyempitkan kartu tanpa menambah kejelasan.
 */
export function PageShell({
  title,
  description,
  eyebrow,
  jumlah,
  hero,
  children,
}: {
  title: string;
  description?: string;
  /** Label kecil di atas judul, misalnya "Riwayat akademik". */
  eyebrow?: string;
  /** Keterangan jumlah isi, misalnya "2 jenjang". Disembunyikan bila kosong. */
  jumlah?: string;
  /** Pembuka dari dashboard; setiap bagian yang kosong jatuh ke nilai halaman. */
  hero?: {
    eyebrow: string | null;
    headline: string | null;
    description: string | null;
  } | null;
  children: ReactNode;
}) {
  // Nilai dari dashboard menang; yang kosong jatuh ke nilai halaman. Dengan
  // begitu pembuka selalu punya isi yang masuk akal sejak awal.
  const labelPembuka = hero?.eyebrow?.trim() || eyebrow;
  const judulPembuka = hero?.headline?.trim() || title;
  const deskripsiPembuka = hero?.description?.trim() || description;

  return (
    <div className="wadah py-8 sm:py-12">
      <PageHero
        eyebrow={labelPembuka}
        headline={judulPembuka}
        description={deskripsiPembuka}
        jumlah={jumlah}
      />

      <div className="mt-10 sm:mt-14">{children}</div>
    </div>
  );
}

/**
 * Blok pembuka besar di atas isi halaman.
 *
 * Judulnya adalah `<h1>` halaman ini — satu-satunya. Dulu ia `<p>` karena
 * ada kepala bagian terpisah yang memegang `<h1>`; sejak kepala itu dihapus,
 * judul di sinilah heading utamanya, dan menjadikannya `<p>` akan membuat
 * halaman sama sekali tidak punya `<h1>`.
 */
function PageHero({
  eyebrow,
  headline,
  description,
  jumlah,
}: {
  eyebrow?: string;
  headline: string;
  description?: string;
  jumlah?: string;
}) {
  return (
    <section
      aria-label="Pembuka halaman"
      className="relative overflow-hidden rounded-card-lg border border-border-subtle bg-linear-to-br from-accent-soft via-surface-raised to-surface-raised px-6 py-10 sm:px-12 sm:py-16 lg:px-16 lg:py-20"
    >
      {/* Bentuk hias; tidak membawa makna, jadi disembunyikan dari pembaca
       * layar. Lingkarannya sengaja meluber keluar tepi kanan atas — itulah
       * yang membuat kotaknya terasa punya kedalaman alih-alih rata. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-pill bg-surface-raised/50 sm:-right-24 sm:size-96"
      />

      <div className="relative">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-pill text-sm font-medium text-text-muted transition-colors hover:text-accent"
        >
          <span
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Kembali ke beranda
        </Link>

        {eyebrow || jumlah ? (
          <div className="mt-8 mb-4 flex flex-wrap items-center gap-3 sm:mt-10">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
                {eyebrow}
              </p>
            ) : null}
            {jumlah ? (
              <span className="rounded-pill border border-border-subtle bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-muted">
                {jumlah}
              </span>
            ) : null}
          </div>
        ) : null}

        <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-text sm:text-5xl lg:text-6xl">
          {headline}
        </h1>

        {description ? (
          <p className="prosa mt-5 text-base text-text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>

      {/* Panah sudut: penanda arah baca ke isi di bawahnya.
       *
       * Ikon, BUKAN karakter "↘". Sebagian peramban merender karakter itu
       * sebagai emoji berwarna, sehingga panahnya muncul biru mencolok dan
       * merusak warna halaman. */}
      <ArrowDownRight
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 right-6 size-7 text-text-subtle sm:bottom-10 sm:right-10 sm:size-9"
      />
    </section>
  );
}

/** Judul bagian di dalam satu halaman. */
export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-2xl sm:text-3xl">{children}</h2>
      {action}
    </div>
  );
}

/**
 * Empty state berbahasa Indonesia. Dipakai di setiap halaman supaya tabel yang
 * kosong tidak pernah menghasilkan area kosong tanpa penjelasan.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface-raised px-6 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-text">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Timeline vertikal. Dipakai halaman Pendidikan dan Pengalaman. */
export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative space-y-4">{children}</ol>;
}

/**
 * Isi satu entri timeline.
 *
 * Merender `<div>`, BUKAN `<li>`: elemen daftarnya sudah disediakan pemanggil
 * (`<Reveal as="li">`). Ketika komponen ini juga merender `<li>`, hasilnya
 * `<li>` di dalam `<li>` — HTML tidak sah. Parser peramban memindahkan elemen
 * yang bersarang salah itu, sehingga DOM-nya berbeda dari yang dirender React
 * dan hydration gagal. Gejalanya hanya muncul di build produksi, di halaman
 * Pendidikan dan Pengalaman.
 */
export function TimelineItem({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="relative rounded-card border border-border-subtle bg-surface-raised p-5 shadow-card sm:p-6 sm:pl-14">
      {/* Titik penanda disembunyikan di layar sempit supaya tidak memakan ruang baca. */}
      <span
        aria-hidden="true"
        className="absolute left-6 top-7 hidden size-3 rounded-pill bg-accent sm:block"
      />
      {meta ? (
        <p className="mb-2 text-sm font-medium text-text-subtle">{meta}</p>
      ) : null}
      {children}
    </div>
  );
}
