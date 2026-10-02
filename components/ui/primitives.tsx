import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

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

/** Pembungkus halaman: judul, deskripsi, dan lebar baca yang konsisten. */
export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-text-muted">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
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

export function TimelineItem({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <li className="relative rounded-card border border-border-subtle bg-surface-raised p-5 shadow-card sm:p-6 sm:pl-14">
      {/* Titik penanda disembunyikan di layar sempit supaya tidak memakan ruang baca. */}
      <span
        aria-hidden="true"
        className="absolute left-6 top-7 hidden size-3 rounded-pill bg-accent sm:block"
      />
      {meta ? (
        <p className="mb-2 text-sm font-medium text-text-subtle">{meta}</p>
      ) : null}
      {children}
    </li>
  );
}
