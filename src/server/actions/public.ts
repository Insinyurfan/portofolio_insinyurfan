import "server-only";

import type { ZodType } from "zod";

import { HONEYPOT_FIELD } from "@/shared/honeypot";
import { senderHash } from "@/server/actions/sender";
import { createServerSupabaseClient } from "@/server/db/client";

/**
 * Pembungkus tunggal untuk setiap jalur tulis PUBLIK.
 *
 * Sejajar dengan `withAdminAction`, tetapi urusannya berbeda: di sisi admin
 * yang mudah terlupa adalah otorisasi; di sini yang mudah terlupa adalah
 * penyaringan spam. Menjadikannya pembungkus berarti form ketiga nanti tidak
 * bisa dibuat tanpa honeypot dan pembatasan laju.
 *
 * Urutannya: honeypot → pembatasan laju → validasi → handler.
 *
 * Honeypot diperiksa SEBELUM pembatasan laju dengan sengaja, supaya lalu
 * lintas bot tidak menghabiskan kuota pengunjung sungguhan yang berbagi satu
 * alamat IP di belakang NAT.
 */

export { HONEYPOT_FIELD } from "@/shared/honeypot";

export type KodeGagalPublik =
  | "validasi"
  | "batas-laju"
  | "server";

export type HasilPublik =
  | { ok: true; message: string }
  | {
      ok: false;
      code: KodeGagalPublik;
      message: string;
      fieldErrors?: Record<string, string>;
    };

/** Error yang disengaja oleh handler; pesannya aman ditampilkan pengunjung. */
export class PublicActionError extends Error {
  constructor(
    message: string,
    readonly code: KodeGagalPublik = "server",
  ) {
    super(message);
    this.name = "PublicActionError";
  }
}

type Opsi = {
  /** Jenis form, menentukan kuota pembatasan laju yang dipakai. */
  jenis: "contact" | "rating";
  /** Pesan konfirmasi saat berhasil. */
  sukses: string;
  /** Maksimum pengiriman per jendela waktu. */
  maksPercobaan?: number;
  /** Panjang jendela waktu dalam detik. */
  jendelaDetik?: number;
};

/**
 * Nilai bawaan dibuat longgar dengan sengaja: beberapa pengunjung bisa berada
 * di belakang satu alamat IP (kantor, kampus, jaringan seluler), dan kuota
 * yang ketat akan memblokir orang yang tidak bersalah.
 */
const MAKS_BAWAAN = 5;
const JENDELA_BAWAAN = 3600;

export function withPublicAction<TIn extends { [k: string]: unknown }, TOut>(
  schema: ZodType<TOut, TIn>,
  handler: (input: TOut) => Promise<void>,
  opsi: Opsi,
) {
  return async (input: TIn): Promise<HasilPublik> => {
    // 1. Honeypot.
    //
    // Pengiriman yang mengisi field ini menerima tanggapan yang SAMA seperti
    // berhasil. Pesan penolakan yang jujur akan memberi tahu pembuat skrip
    // field mana yang harus dikosongkan.
    const honeypot = input[HONEYPOT_FIELD];
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      console.warn("[public-action] pengiriman dengan honeypot terisi diabaikan");
      return { ok: true, message: opsi.sukses };
    }

    // 2. Pembatasan laju.
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_sender_hash: await senderHash(),
        p_form_kind: opsi.jenis,
        p_max_attempts: opsi.maksPercobaan ?? MAKS_BAWAAN,
        p_window_seconds: opsi.jendelaDetik ?? JENDELA_BAWAAN,
      });

      if (error) {
        console.error("[public-action] pembatasan laju gagal:", error.message);
        return {
          ok: false,
          code: "server",
          message: "Terjadi kesalahan di server. Coba lagi beberapa saat.",
        };
      }

      if (data !== true) {
        return {
          ok: false,
          code: "batas-laju",
          message:
            "Anda sudah mengirim beberapa kali dalam waktu singkat. Silakan coba lagi nanti.",
        };
      }
    } catch (error) {
      console.error("[public-action] pembatasan laju melempar error:", error);
      return {
        ok: false,
        code: "server",
        message: "Terjadi kesalahan di server. Coba lagi beberapa saat.",
      };
    }

    // 3. Validasi — server yang menjadi penentu, bukan klien.
    const hasil = schema.safeParse(input);
    if (!hasil.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of hasil.error.issues) {
        const key = issue.path.join(".") || "_";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return {
        ok: false,
        code: "validasi",
        message: "Periksa kembali isian yang ditandai.",
        fieldErrors,
      };
    }

    // 4. Handler.
    try {
      await handler(hasil.data);
    } catch (error) {
      if (error instanceof PublicActionError) {
        return { ok: false, code: error.code, message: error.message };
      }
      console.error("[public-action] kegagalan tak terduga:", error);
      return {
        ok: false,
        code: "server",
        message:
          "Terjadi kesalahan di server dan kiriman Anda tidak tersimpan. Coba lagi beberapa saat.",
      };
    }

    // Jalur tulis publik TIDAK merevalidasi apa pun dengan sengaja: kiriman
    // pengunjung tidak mengubah hal yang tampil — pesan tidak pernah tampil,
    // rating baru belum disetujui. Merevalidasi di sini hanya membuang kerja
    // dan memberi orang luar cara memaksa pembangunan ulang halaman.
    return { ok: true, message: opsi.sukses };
  };
}
