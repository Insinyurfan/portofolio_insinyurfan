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
 * Pembungkus halaman: tautan pulang, pembuka, lalu isinya.
 *
 * Tautan "Kembali ke beranda" selalu dirender. Navbar memang sudah memuat
 * tautan beranda, tetapi di halaman dalam yang panjang navbar ikut tergulung
 * ke atas, sementara tautan ini berada tepat di awal konten utama — dan ia
 * ikut terbaca pembaca layar sebagai bagian dari halaman, bukan navigasi situs.
 *
 * `hero` bersifat opsional dan datang dari database. Halaman yang pembukanya
 * belum diisi pemilik merender bentuk tanpa pembuka, persis seperti sebelum
 * fitur ini ada.
 */
export function PageShell({
  title,
  description,
  eyebrow,
  jumlah,
  hero,
  panel = true,
  children,
}: {
  title: string;
  description?: string;
  /** Label kecil di atas judul, misalnya "Riwayat akademik". */
  eyebrow?: string;
  /** Keterangan jumlah isi, misalnya "2 jenjang". Disembunyikan bila kosong. */
  jumlah?: string;
  /** Blok pembuka besar; null berarti tidak dirender. */
  hero?: {
    eyebrow: string | null;
    headline: string | null;
    description: string | null;
  } | null;
  /**
   * Isi halaman dibungkus panel bersudut membulat, bukan menempel langsung ke
   * latar. Dimatikan hanya untuk halaman yang isinya memang sudah berupa
   * kartu-kartu lebar dan akan terasa bertumpuk kalau dibungkus lagi.
   */
  panel?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="wadah py-10 sm:py-14">
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

      {hero?.headline ? (
        <PageHero hero={hero} jumlah={jumlah} />
      ) : null}

      <header
        className={
          hero?.headline
            ? "mt-8 mb-8 sm:mt-10 sm:mb-12"
            : "mt-6 mb-8 sm:mt-8 sm:mb-12"
        }
      >
        {eyebrow || (jumlah && !hero?.headline) ? (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
                {eyebrow}
              </p>
            ) : null}
            {/* Hitungan hanya muncul sekali: kalau ada pembuka, ia tampil di
                sana, bukan diulang di kepala bagian. */}
            {jumlah && !hero?.headline ? <Badge tone="accent">{jumlah}</Badge> : null}
          </div>
        ) : null}

        <h1
          className={
            hero?.headline
              ? "text-2xl sm:text-3xl"
              : "text-3xl sm:text-4xl lg:text-5xl"
          }
        >
          {title}
        </h1>

        {description ? (
          <p className="prosa mt-3 text-base text-text-muted">{description}</p>
        ) : null}
      </header>

      {panel ? (
        /* `surface-sunken`, bukan `surface-raised`: kartu di dalam halaman
         * sudah memakai `surface-raised`, jadi panel berwarna sama akan
         * membuat keduanya menyatu dan "kotak"-nya justru hilang. Dengan
         * sunken, panelnya terbaca sebagai wadah dan kartunya tetap menonjol —
         * di tema terang maupun gelap. */
        <div className="rounded-card-lg border border-border-subtle bg-surface-sunken p-5 sm:p-8 lg:p-10">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Blok pembuka besar di atas kepala halaman.
 *
 * Judulnya dirender sebagai `<p>`, BUKAN heading. Halaman hanya boleh punya
 * satu `<h1>`, dan itu milik judul halamannya; menjadikan kalimat editorial
 * ini heading kedua membuat struktur dokumen menyesatkan bagi pembaca layar
 * dan bagi mesin pencari.
 */
function PageHero({
  hero,
  jumlah,
}: {
  hero: {
    eyebrow: string | null;
    headline: string | null;
    description: string | null;
  };
  jumlah?: string;
}) {
  return (
    <section
      aria-label="Pembuka halaman"
      className="relative mt-6 overflow-hidden rounded-card-lg border border-border-subtle bg-accent-soft px-6 py-10 sm:mt-8 sm:px-10 sm:py-14"
    >
      {/* Bentuk hias; tidak membawa makna, jadi disembunyikan dari pembaca layar. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-pill bg-surface-raised/40 sm:size-72"
      />

      <div className="relative">
        {hero.eyebrow || jumlah ? (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {hero.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft-text">
                {hero.eyebrow}
              </p>
            ) : null}
            {jumlah ? (
              <span className="rounded-pill bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-muted">
                {jumlah}
              </span>
            ) : null}
          </div>
        ) : null}

        <p className="font-heading text-3xl font-bold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
          {hero.headline}
        </p>

        {hero.description ? (
          <p className="prosa mt-4 text-base text-accent-soft-text sm:text-lg">
            {hero.description}
          </p>
        ) : null}
      </div>
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
