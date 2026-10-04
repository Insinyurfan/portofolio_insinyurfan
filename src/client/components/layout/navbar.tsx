"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/client/components/layout/theme-toggle";
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

export function Navbar({ identitas }: { identitas: IdentitasSitus }) {
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
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [terbuka]);

  // Fokus masuk ke dalam panel saat dibuka.
  useEffect(() => {
    if (!terbuka) return;
    const pertama = panelRef.current?.querySelector<HTMLElement>("a[href]");
    pertama?.focus();
  }, [terbuka]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/85 backdrop-blur">
      <nav
        aria-label="Navigasi utama"
        className="wadah flex items-center justify-between gap-3 py-3"
      >
        {/* Nama dan logo berasal dari database, bukan ditulis di kode: keduanya
         * diatur pemilik lewat /admin/profil seperti isi halaman yang lain. */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-base font-bold tracking-tight text-text"
        >
          {identitas.logoUrl ? (
            <Image
              src={identitas.logoUrl}
              alt=""
              width={32}
              height={32}
              // Logo tampil di layar pertama setiap halaman, jadi tidak
              // di-lazy-load — menundanya membuat header berkedip saat dimuat.
              priority
              // Rasio apa pun muat tanpa terpotong atau meregang; pemilik
              // tidak dipaksa menyiapkan logo persegi.
              className="size-8 shrink-0 rounded-md object-contain"
            />
          ) : null}
          {identitas.nama}
        </Link>

        {/* Layar lebar: tautan berderet. */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={aktif(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-pill px-3 py-2 text-sm font-medium transition-colors",
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

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            ref={tombolRef}
            type="button"
            onClick={() => (terbuka ? tutup() : setTerbuka(true))}
            aria-expanded={terbuka}
            aria-controls="menu-mobile"
            aria-label={terbuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="inline-flex size-9 items-center justify-center rounded-pill border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent lg:hidden"
          >
            {terbuka ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Menu className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Layar sempit: panel yang dapat dibuka-tutup. */}
      {terbuka ? (
        <div
          ref={panelRef}
          id="menu-mobile"
          className="border-t border-border-subtle bg-surface-raised lg:hidden"
        >
          <ul className="wadah py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={tutup}
                  aria-current={aktif(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-card px-3 py-3 text-sm font-medium transition-colors",
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
        </div>
      ) : null}
    </header>
  );
}
