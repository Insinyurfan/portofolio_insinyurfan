import { Toaster } from "@/client/components/admin/toaster";

/**
 * Kerangka halaman masuk: hanya kotak yang terpusat, tanpa sidebar.
 *
 * `.admin-root` tetap diperlukan — class itulah yang melingkupi seluruh token
 * `adm-*`. Tanpanya, form masuk tidak punya warna sama sekali.
 */

// Lihat catatan yang sama di app/admin/(dashboard)/layout.tsx.
export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root flex min-h-dvh items-center justify-center p-4">
      {children}
      <Toaster />
    </div>
  );
}
