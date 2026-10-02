"use client";

import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Toaster } from "@/components/admin/toaster";

/**
 * Kerangka dashboard.
 *
 * `.admin-root` adalah class yang melingkupi seluruh token `adm-*`. Tanpa
 * pembungkus ini, komponen admin tidak punya warna sama sekali — dan itu
 * disengaja: token admin tidak pernah bocor ke halaman publik.
 *
 * Halaman login memakai kerangka yang sama tetapi tanpa sidebar, karena di
 * sana belum ada sesi yang bisa dinavigasi.
 */
export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const diHalamanLogin = pathname === "/admin/login";

  if (diHalamanLogin) {
    return (
      <div className="admin-root flex min-h-dvh items-center justify-center p-4">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="admin-root flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar onLogout={() => void logoutAction()} />

      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>

      <Toaster />
    </div>
  );
}
