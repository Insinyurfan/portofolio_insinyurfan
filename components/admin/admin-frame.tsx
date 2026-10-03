"use client";

import { keluarAction } from "@/app/admin/actions-auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Toaster } from "@/components/admin/toaster";

/**
 * Kerangka dashboard.
 *
 * `.admin-root` adalah class yang melingkupi seluruh token `adm-*`. Tanpa
 * pembungkus ini, komponen admin tidak punya warna sama sekali — dan itu
 * disengaja: token admin tidak pernah bocor ke halaman publik.
 *
 * Komponen ini dipakai HANYA oleh route group (dashboard), jadi ia tidak perlu
 * menebak-nebak apakah sedang berada di halaman masuk. Halaman masuk punya
 * layout-nya sendiri; alasannya ada di app/admin/layout.tsx.
 */
export function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar onLogout={() => void keluarAction()} />

      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>

      <Toaster />
    </div>
  );
}
