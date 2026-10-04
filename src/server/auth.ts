import "server-only";

import type { User } from "@supabase/supabase-js";

import { adminEmail } from "@/shared/env";
import { createSessionSupabaseClient } from "@/server/db/session";

/**
 * Otorisasi admin.
 *
 * Ditegakkan DUA KALI dengan sengaja:
 *   - proxy (proxy.ts) mengalihkan permintaan halaman tanpa sesi ke /admin/login
 *   - fungsi di berkas ini dipanggil di setiap aksi tulis dan setiap
 *     pembacaan data admin
 *
 * Proxy adalah lapisan pengalaman pengguna, BUKAN batas keamanan: ia
 * tidak berjalan di jalur pemanggilan Server Action. Karena itu pemeriksaan
 * harus ada juga di dalam aksinya sendiri.
 * Lihat design.md → "Otorisasi ditegakkan dua kali".
 */

export type HasilAuth =
  | { ok: true; user: User }
  | { ok: false; alasan: "tanpa-sesi" | "bukan-admin" };

function cocokDenganAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === adminEmail();
}

/**
 * Memeriksa sesi tanpa melempar error. Dipakai proxy dan halaman login
 * yang perlu tahu status tanpa menghentikan render.
 */
export async function cekAdmin(): Promise<HasilAuth> {
  const supabase = await createSessionSupabaseClient();

  // getUser() memverifikasi token ke server Auth; getSession() hanya membaca
  // cookie dan isinya bisa dipalsukan. Untuk keputusan otorisasi, harus getUser().
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false, alasan: "tanpa-sesi" };
  }

  if (!cocokDenganAdmin(data.user.email)) {
    return { ok: false, alasan: "bukan-admin" };
  }

  return { ok: true, user: data.user };
}

/**
 * Melempar error bila pemanggil bukan admin. Dipakai pembungkus aksi tulis,
 * yang menangkapnya dan mengubahnya menjadi hasil bertipe.
 */
export class AuthError extends Error {
  constructor(readonly alasan: "tanpa-sesi" | "bukan-admin") {
    super(
      alasan === "tanpa-sesi"
        ? "Sesi Anda sudah berakhir. Silakan masuk kembali."
        : "Akun ini tidak memiliki akses ke dashboard admin.",
    );
    this.name = "AuthError";
  }
}

export async function requireAdmin(): Promise<User> {
  const hasil = await cekAdmin();
  if (!hasil.ok) throw new AuthError(hasil.alasan);
  return hasil.user;
}
