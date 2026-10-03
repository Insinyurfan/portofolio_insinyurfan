"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { masukAction } from "@/app/admin/actions-auth";
import { Button, Field, Input, Panel } from "@/components/admin/ui";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak sah."),
  password: z.string().min(1, "Password wajib diisi."),
});

type LoginInput = z.infer<typeof loginSchema>;

/**
 * Form login admin.
 *
 * Catatan yang disengaja:
 *   - Autentikasinya dikerjakan Server Action, bukan klien Supabase peramban.
 *     Alasannya ada di app/admin/actions-auth.ts: cookie sesi harus ikut di
 *     respons yang sama dengan pengalihannya, kalau tidak proxy belum melihat
 *     sesi itu dan memantulkan admin kembali ke beranda. Efek sampingnya
 *     menyenangkan — @supabase/ssr tidak lagi ikut ke bundel peramban.
 *   - Tujuan setelah masuk ditentukan di server lewat cookie httpOnly, jadi
 *     komponen ini tidak perlu (dan tidak boleh) menerimanya sebagai prop.
 *   - Pesan error selalu generik ("email atau password salah"), tidak pernah
 *     menyebut apakah emailnya terdaftar. Itu mencegah form ini dipakai untuk
 *     menebak alamat email mana yang punya akun.
 *   - Field password dikosongkan setiap kali gagal, isian email dipertahankan.
 *   - Validasi kosong terjadi di klien, jadi tidak ada permintaan autentikasi
 *     yang dikirim untuk form yang jelas belum lengkap.
 */
export function LoginForm() {
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(nilai: LoginInput) {
    setErrorUmum(null);

    // Saat berhasil, aksinya mengalihkan dan tidak pernah kembali ke sini.
    const hasil = await masukAction(nilai);

    setErrorUmum(hasil.pesan);
    setValue("password", "");
    setFocus("password");
  }

  return (
    <Panel className="w-full max-w-sm">
      <h1 className="text-lg font-bold text-adm-fg">Masuk ke Dashboard</h1>
      <p className="mt-1 text-sm text-adm-fg-muted">
        Halaman ini hanya untuk pemilik portofolio.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
        <Field id="email" label="Email" error={errors.email?.message} required>
          {(aria) => (
            <Input
              {...aria}
              {...register("email")}
              type="email"
              autoComplete="username"
              placeholder="email@contoh.com"
            />
          )}
        </Field>

        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          required
        >
          {(aria) => (
            <Input
              {...aria}
              {...register("password")}
              type="password"
              autoComplete="current-password"
            />
          )}
        </Field>

        {errorUmum ? (
          <p
            role="alert"
            className="rounded-adm bg-adm-danger-soft px-3 py-2 text-sm font-medium text-adm-danger"
          >
            {errorUmum}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <LogIn aria-hidden="true" />
          {isSubmitting ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>
    </Panel>
  );
}
