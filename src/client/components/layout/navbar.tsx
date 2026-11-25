"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/client/components/layout/theme-toggle";
import { CvActions } from "@/client/components/public/cv-preview";
import { cn } from "@/shared/cn";
import { NAV_ITEMS } from "@/shared/constants";

/**
 * Navbar responsif.
 *
 * Panel mobile memenuhi syarat spesifikasi: dapat ditutup lewat tombol,
 * Escape, dan pemilihan tautan; fokus terkurung di dalamnya saat terbuka;
 * dan fokus kembali ke tombol pembuka setelah ditutup.
 */
export type IdentitasSitus = {
  /** Nama di pojok kiri header. Sudah berisi nilai cadangan bila belum diatur. */
  nama: string;
  /** URL logo, atau null bila pemilik belum mengunggahnya. */
  logoUrl: string | null;
};

export function Navbar({
  identitas,
  cv,
}: {
  identitas: IdentitasSitus;
  cv: { cvUrl: string; namaPemilik: string } | null;
}) {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);

  const tombolRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  function aktif(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Menutup panel mengembalikan fokus ke tombol pembuka.
  function tutup() {
    setTerbuka(false);
    tombolRef.current?.focus();
  }

  // Escape menutup panel; Tab dikurung di dalam panel selama terbuka.
  useEffect(() => {
    if (!terbuka) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        tutup();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const fokusable = panel.querySelectorAll<HTMLElement>(
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
    const layarLebar = window.matchMedia("(min-width: 80rem)");
    function tutupDiDesktop(event: MediaQueryListEvent) {
      if (event.matches) setTerbuka(false);
    }
    layarLebar.addEventListener("change", tutupDiDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      layarLebar.removeEventListener("change", tutupDiDesktop);
    };
  }, [terbuka]);

  // Fokus masuk ke dalam panel saat dibuka.
  useEffect(() => {
    if (!terbuka) return;
    const pertama = panelRef.current?.querySelector<HTMLElement>("a[href]");
    pertama?.focus();
  }, [terbuka]);

  return (
    <header className="wadah sticky top-2 z-40 mt-2 sm:top-4 sm:mt-4">
      {terbuka ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-overlay xl:hidden"
          onClick={tutup}
        />
      ) : null}
      <div className="rounded-card-lg border border-border-subtle bg-surface-raised/95 shadow-card backdrop-blur-md">
        <nav
          aria-label="Navigasi utama"
          className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 xl:gap-3 xl:px-5"
        >
          {/* Nama dan logo berasal dari database, bukan ditulis di kode: keduanya
           * diatur pemilik lewat /admin/profil seperti isi halaman yang lain. */}
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2.5 font-heading text-base font-bold tracking-tight text-text xl:max-w-36 xl:flex-none 2xl:max-w-44"
            onClick={() => { if (terbuka) tutup(); }}
          >
            {identitas.logoUrl ? (
              <Image
                src={identitas.logoUrl}
                alt=""
                width={32}
                height={32}
                unoptimized
                // Logo tampil di layar pertama setiap halaman, jadi tidak
                // di-lazy-load — menundanya membuat header berkedip saat dimuat.
                preload
                // Rasio apa pun muat tanpa terpotong atau meregang; pemilik
                // tidak dipaksa menyiapkan logo persegi.
                className="size-8 shrink-0 rounded-md bg-logo-background object-contain p-0.5"
              />
            ) : null}
            <span className="truncate">{identitas.nama}</span>
          </Link>

          {/* Layar lebar: tautan berderet. */}
          <ul className="hidden items-center gap-0.5 xl:flex 2xl:gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={aktif(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-pill px-2.5 py-2 text-sm font-medium transition-colors 2xl:px-3",
                    aktif(item.href)
                      ? "bg-accent-soft text-accent-soft-text"
                      : "text-text-muted hover:text-accent",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden shrink-0 items-center xl:flex">
            <ThemeToggle />
          </div>

          {cv ? (
            <div className="hidden shrink-0 justify-center xl:flex">
              <CvActions {...cv} ringkas />
            </div>
          ) : null}

          <button
            ref={tombolRef}
            type="button"
            onClick={() => (terbuka ? tutup() : setTerbuka(true))}
            aria-expanded={terbuka}
            aria-controls="menu-mobile"
            aria-label={terbuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-subtle text-text transition-colors hover:border-accent hover:text-accent xl:hidden"
          >
            {terbuka ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>

      <div
        id="menu-mobile"
        ref={panelRef}
        className={cn(
          "absolute inset-x-4 top-[calc(100%+0.5rem)] mx-auto max-h-[calc(100dvh-5.75rem)] max-w-lg overflow-y-auto overscroll-contain rounded-card-lg border border-border-subtle bg-surface-raised p-2 shadow-card-hover sm:inset-x-6 xl:hidden",
          !terbuka && "hidden",
        )}
      >
        <nav aria-label="Menu navigasi mobile">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={tutup}
                  aria-current={aktif(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    aktif(item.href)
                      ? "bg-accent-soft text-accent-soft-text"
                      : "text-text-muted hover:bg-surface-sunken hover:text-accent",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-2 pt-2">
          {cv ? (
            <CvActions
              {...cv}
              ringkas
              onPratinjau={() => setTerbuka(false)}
              kembaliFokusKe={tombolRef}
            />
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
