import { AdminFrame } from "@/client/components/admin/admin-frame";

/**
 * Kerangka untuk halaman dashboard yang sebenarnya — semua yang ada di dalam
 * route group ini. Halaman masuk berada di luarnya dan tidak ikut mendapat
 * sidebar; lihat catatan di app/admin/layout.tsx.
 */

// Sudah diwarisi dari app/admin/layout.tsx, tetapi dinyatakan ulang dengan
// sengaja: larangan cache di route admin terlalu penting untuk bergantung pada
// pewarisan yang tidak terlihat saat berkas ini dibaca sendirian.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminFrame>{children}</AdminFrame>;
}
