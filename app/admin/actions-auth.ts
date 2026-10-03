"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { adminEmail } from "@/lib/env";
import { createSessionSupabaseClient } from "@/lib/supabase/session";

/**
 * Masuk dan keluar dashboard admin.
 *
 * Proses masuk dikerjakan di SERVER, bukan di peramban, dan itu bukan pilihan
 * gaya. Dengan klien peramban, cookie sesi ditulis lewat `document.cookie`
 * setelah `signInWithPassword` selesai, sementara navigasi ke /admin sudah
 * berjalan — proxy.ts kerap belum melihat sesinya dan memantulkan admin
 * kembali ke beranda. Pantulan itu hanya terjadi sekali dan tidak ada yang
 * mencobanya lagi, jadi menunggu sesudahnya tidak menolong.
 *
 * Di dalam Server Action, cookie sesi ikut di respons HTTP yang sama dengan
 * pengalihannya. Permintaan berikutnya sudah membawa cookie itu, sehingga
 * tidak ada balapan waktu yang mungkin terjadi.
 */

/** Tujuan semula disimpan proxy di cookie ini; nama harus sama dengan proxy.ts. */
const COOKIE_TUJUAN = "adm_tujuan";

const skemaMasuk = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

export type HasilMasuk = { pesan: string };

/** Pesan seragam: tidak pernah menyebut apakah emailnya terdaftar. */
const PESAN_GAGAL = "Email atau password salah. Silakan coba lagi.";

/**
 * Tujuan setelah masuk, dibaca dari cookie yang disetel proxy.
 *
 * Nilainya TIDAK diterima dari klien: cookie-nya httpOnly, dan hanya path di
 * bawah /admin yang diterima — supaya cookie ini tidak bisa dipakai
 * mengarahkan siapa pun ke situs lain.
 */
async function tujuanSetelahMasuk(): Promise<string> {
  const mentah = (await cookies()).get(COOKIE_TUJUAN)?.value;
  if (mentah === undefined) return "/admin";

  // Nilai cookie sampai di sini masih ter-encode persen, karena itulah cara
  // cookie disandikan saat dikirim. Tanpa decode, "/admin/proyek" terbaca
  // sebagai "%2Fadmin%2Fproyek" dan pemeriksaan di bawah selalu gagal.
  let tujuan: string;
  try {
    tujuan = decodeURIComponent(mentah);
  } catch {
    return "/admin";
  }

  const aman =
    tujuan.startsWith("/admin") &&
    !tujuan.startsWith("//") &&
    !tujuan.startsWith("/admin/login");

  return aman ? tujuan : "/admin";
}

export async function masukAction(
  masukan: z.input<typeof skemaMasuk>,
): Promise<HasilMasuk> {
  const terurai = skemaMasuk.safeParse(masukan);
  if (!terurai.success) {
    return { pesan: PESAN_GAGAL };
  }

  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: terurai.data.email,
    password: terurai.data.password,
  });

  if (error || !data.user) {
    return { pesan: PESAN_GAGAL };
  }

  // Kredensial sah belum berarti berhak: hanya satu email yang boleh masuk.
  // Sesinya dibatalkan supaya cookie-nya tidak tertinggal di peramban.
  if (data.user.email?.trim().toLowerCase() !== adminEmail()) {
    await supabase.auth.signOut();
    return { pesan: PESAN_GAGAL };
  }

  const tujuan = await tujuanSetelahMasuk();

  // Cookie tujuan sudah terpakai; dihapus supaya kunjungan berikutnya tidak
  // ikut terbawa ke halaman yang sama.
  (await cookies()).delete(COOKIE_TUJUAN);

  // redirect() melempar untuk menghentikan aksi, jadi harus di luar try/catch.
  redirect(tujuan);
}

/** Mengakhiri sesi dan mengembalikan ke beranda. */
export async function keluarAction(): Promise<void> {
  const supabase = await createSessionSupabaseClient();
  await supabase.auth.signOut();

  // Ke beranda, bukan ke /admin/login: alamat itu sengaja dialihkan proxy, dan
  // alamat masuk yang sebenarnya tidak boleh ikut terlihat setelah keluar.
  redirect("/");
}
