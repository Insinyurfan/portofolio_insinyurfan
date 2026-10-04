import type { Metadata } from "next";

/**
 * Layout terluar seluruh route /admin.
 *
 * Sengaja TIDAK memuat kerangka dashboard. Halaman masuk dan halaman dashboard
 * punya kerangka yang berbeda, dan keduanya dipilih lewat route group — bukan
 * lewat pemeriksaan pathname di dalam satu komponen.
 *
 * Itu bukan soal kerapian. Proxy me-rewrite alamat masuk yang rahasia ke
 * /admin/login, sementara `usePathname()` membaca bilah alamat peramban dan
 * tetap mengembalikan alamat rahasianya. Kerangka yang memilih tampilan
 * berdasarkan pathname akan menyangka halaman masuk adalah halaman dashboard,
 * lalu merender sidebar lengkap di sana — beserta prefetch Next ke setiap
 * tautan admin di dalamnya.
 *
 * `force-dynamic` memastikan halaman admin tidak pernah di-cache: isinya data
 * langsung termasuk draf, dan konten admin tidak boleh muncul lewat tombol
 * kembali setelah logout. Header larangan cache disetel di proxy.ts.
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
  return children;
}
