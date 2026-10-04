"use client";

import {
  Award,
  Briefcase,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  Star,
  User,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/client/components/admin/ui";
import { cn } from "@/shared/cn";

const ITEM = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/profil", label: "Profil", icon: User },
  { href: "/admin/tautan-sosial", label: "Tautan Sosial", icon: Link2 },
  { href: "/admin/pendidikan", label: "Pendidikan", icon: GraduationCap },
  { href: "/admin/keahlian", label: "Keahlian", icon: Wrench },
  { href: "/admin/pengalaman", label: "Pengalaman", icon: Briefcase },
  { href: "/admin/proyek", label: "Proyek", icon: FolderKanban },
  { href: "/admin/pencapaian", label: "Pencapaian", icon: Award },
  { href: "/admin/pesan", label: "Pesan", icon: Mail },
  { href: "/admin/rating", label: "Rating", icon: Star },
] as const;

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);
  const tombolRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  function aktif(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function tutup() {
    setTerbuka(false);
    tombolRef.current?.focus();
  }

  // Escape menutup panel; Tab dikurung di dalamnya selama terbuka.
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
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [terbuka]);

  const isi = (
    <>
      <div className="px-3 pb-4">
        <p className="text-sm font-bold text-adm-fg">Dashboard</p>
        <p className="text-xs text-adm-fg-subtle">Kelola isi portofolio</p>
      </div>

      <ul className="space-y-0.5">
        {ITEM.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setTerbuka(false)}
                aria-current={aktif(item.href) ? "page" : undefined}
                /**
                 * Prefetch DIMATIKAN, dan ini justru yang membuat dashboard
                 * terasa cepat.
                 *
                 * Setiap halaman admin `force-dynamic`, jadi prefetch bukan
                 * sekadar mengunduh berkas statis — ia memaksa server merender
                 * halaman itu sungguhan, lengkap dengan pemeriksaan sesi dan
                 * query databasenya. Dengan sepuluh tautan di sidebar, satu
                 * kunjungan memicu sepuluh render dinamis sekaligus, dan klik
                 * pengguna harus mengantre di belakangnya.
                 *
                 * Terukur di produksi: server menjawab satu halaman dalam
                 * ~330 ms, tetapi yang dirasakan ~1200 ms karena antrean itu.
                 * Hasilnya pun tidak terpakai — konten dinamis tidak dapat
                 * disimpan lama di cache peramban.
                 */
                prefetch={false}
                className={cn(
                  "flex items-center gap-2.5 rounded-adm px-3 py-2 text-sm transition-colors",
                  aktif(item.href)
                    ? "bg-adm-primary text-adm-primary-fg font-medium"
                    : "text-adm-fg-muted hover:bg-adm-panel-muted hover:text-adm-fg",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-adm-border px-3 pt-4">
        <Link
          href="/"
          className="mb-2 block text-xs text-adm-fg-subtle underline-offset-2 hover:underline"
        >
          Lihat situs publik →
        </Link>
        <Button variant="outline" size="sm" onClick={onLogout} className="w-full">
          <LogOut className="size-4" aria-hidden="true" />
          Keluar
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Bar atas hanya untuk layar sempit. */}
      <div className="flex items-center justify-between border-b border-adm-border bg-adm-panel px-4 py-3 lg:hidden">
        <p className="text-sm font-bold text-adm-fg">Dashboard</p>
        <Button
          ref={tombolRef}
          variant="outline"
          size="icon"
          onClick={() => (terbuka ? tutup() : setTerbuka(true))}
          aria-expanded={terbuka}
          aria-controls="sidebar-admin"
          aria-label={terbuka ? "Tutup menu" : "Buka menu"}
        >
          {terbuka ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      {/* Layar lebar: sidebar menetap. */}
      <nav
        aria-label="Navigasi dashboard"
        className="hidden w-60 shrink-0 border-r border-adm-border bg-adm-panel p-3 lg:block"
      >
        {isi}
      </nav>

      {/* Layar sempit: panel yang dapat dibuka-tutup. */}
      {terbuka ? (
        <div
          className="fixed inset-0 z-40 bg-adm-overlay lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) tutup();
          }}
        >
          <nav
            ref={panelRef}
            id="sidebar-admin"
            aria-label="Navigasi dashboard"
            className="h-full w-64 overflow-y-auto border-r border-adm-border bg-adm-panel p-3"
          >
            {isi}
          </nav>
        </div>
      ) : null}
    </>
  );
}
