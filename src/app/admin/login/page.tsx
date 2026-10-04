import type { Metadata } from "next";

import { LoginForm } from "@/client/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk — Dashboard Admin",
  robots: { index: false, follow: false },
};

/**
 * Halaman ini hanya dicapai lewat alamat rahasia ADMIN_LOGIN_PATH; proxy.ts
 * yang me-rewrite-nya ke sini, dan menolak akses langsung ke /admin/login.
 *
 * Tujuan setelah masuk tidak ditentukan di sini: masukAction() membacanya
 * sendiri dari cookie httpOnly yang disetel proxy, sehingga alamat halaman
 * admin tidak ikut terlihat di bilah alamat maupun di payload halaman ini.
 */
export default function LoginPage() {
  return <LoginForm />;
}
