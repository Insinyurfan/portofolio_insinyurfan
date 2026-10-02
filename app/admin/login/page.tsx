import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk — Dashboard Admin",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string }>;
}) {
  const { lanjut } = await searchParams;

  // Hanya path internal yang diterima sebagai tujuan, supaya parameter ini
  // tidak bisa dipakai mengarahkan orang ke situs lain.
  const tujuan =
    lanjut && lanjut.startsWith("/admin") && !lanjut.startsWith("//")
      ? lanjut
      : "/admin";

  return <LoginForm tujuan={tujuan} />;
}
