import type { Metadata } from "next";

import { ButtonLink, EmptyState } from "@/client/components/ui/primitives";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  description: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
};

export default function NotFound() {
  return (
    <div className="wadah py-20">
      <p className="font-heading text-6xl font-bold text-accent">404</p>

      <div className="mt-6">
        <EmptyState
          title="Halaman tidak ditemukan"
          description="Alamat yang Anda buka tidak ada, sudah dipindahkan, atau isinya belum diterbitkan."
          action={<ButtonLink href="/">Kembali ke beranda</ButtonLink>}
        />
      </div>
    </div>
  );
}
