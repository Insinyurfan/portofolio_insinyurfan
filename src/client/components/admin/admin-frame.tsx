"use client";

import { keluarAction } from "@/server/actions/auth";
import { AdminSidebar } from "@/client/components/admin/sidebar";
import { Toaster } from "@/client/components/admin/toaster";

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

      {/* Isi memakai seluruh ruang yang tersisa di samping sidebar.
       *
       * Sebelumnya dibatasi `max-w-4xl` dan dipusatkan, sehingga di monitor
       * lebar muncul pita kosong di kiri dan kanan tabel — sementara kolom
       * tabelnya sendiri terhimpit. Dashboard isinya daftar dan form, bukan
       * bacaan panjang, jadi tidak ada alasan membatasi panjang barisnya.
       *
       * Padding ikut melebar bertahap agar isinya tidak menempel ke tepi
       * jendela di layar besar. */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 2xl:px-10 2xl:py-8">
        {children}
      </main>

      <Toaster />
    </div>
  );
}
