import type { Metadata } from "next";

import { AdminFrame } from "@/components/admin/admin-frame";

/**
 * Layout dashboard.
 *
 * `force-dynamic` memastikan halaman admin tidak pernah di-cache: isinya data
 * langsung termasuk draf, dan konten admin tidak boleh muncul lewat tombol
 * kembali setelah logout. Header larangan cache disetel di middleware.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Admin",
  description: "Kelola seluruh isi portofolio.",
  // Dashboard tidak boleh diindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminFrame>{children}</AdminFrame>;
}
