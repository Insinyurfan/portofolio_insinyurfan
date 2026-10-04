import "server-only";

import type { ZodType } from "zod";

import { AuthError, requireAdmin } from "@/server/auth";
import {
  revalidasiUntuk,
  type Entitas,
  type KonteksRevalidasi,
} from "@/server/actions/revalidate";

/**
 * Pembungkus tunggal untuk setiap aksi tulis admin.
 *
 * Berurutan: otorisasi → validasi → handler → revalidasi.
 *
 * Ketiga langkah pertama adalah hal yang paling mudah terlupa pada aksi ke-dua
 * belas. Menjadikannya pembungkus berarti aksi baru tidak bisa dibuat tanpa
 * ketiganya. Lihat design.md → "Mutasi lewat Server Action, dibungkus satu helper".
 */

export type KodeGagal =
  | "sesi-berakhir"
  | "bukan-admin"
  | "validasi"
  | "konflik"
  | "server";

export type HasilAksi<T = undefined> =
  | { ok: true; message: string; data?: T; peringatan?: string }
  | {
      ok: false;
      code: KodeGagal;
      message: string;
      fieldErrors?: Record<string, string>;
    };

/** Error yang disengaja oleh handler, pesannya aman ditampilkan ke admin. */
export class AksiError extends Error {
  constructor(
    message: string,
    readonly code: KodeGagal = "server",
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AksiError";
  }
}

type Opsi<TOut, TData> = {
  /** Pesan toast saat berhasil. Boleh fungsi agar bisa menyebut nama item. */
  sukses: string | ((input: TOut, data: TData) => string);
  /**
   * Entitas yang berubah, untuk peta revalidasi.
   *
   * Boleh berupa fungsi: aksi lintas entitas seperti toggle terbit, pengurutan,
   * dan hapus baru mengetahui tabelnya saat dijalankan, bukan saat pembungkus
   * ini dibuat.
   */
  revalidasi?: Entitas | ((input: TOut, data: TData) => Entitas | undefined);
  /** Konteks revalidasi tambahan, dihitung setelah handler selesai. */
  konteks?: (input: TOut, data: TData) => KonteksRevalidasi;
};

export function withAdminAction<TIn, TOut, TData>(
  schema: ZodType<TOut, TIn>,
  handler: (input: TOut) => Promise<TData>,
  opsi: Opsi<TOut, TData>,
) {
  return async (input: TIn): Promise<HasilAksi<TData>> => {
    // 1. Otorisasi — sebelum handler menyentuh apa pun.
    try {
      await requireAdmin();
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          ok: false,
          code: error.alasan === "tanpa-sesi" ? "sesi-berakhir" : "bukan-admin",
          message: error.message,
        };
      }
      throw error;
    }

    // 2. Validasi — server yang menjadi penentu, bukan klien.
    const hasilParse = schema.safeParse(input);
    if (!hasilParse.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of hasilParse.error.issues) {
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

    const data = hasilParse.data;

    // 3. Handler.
    let hasil: TData;
    try {
      hasil = await handler(data);
    } catch (error) {
      if (error instanceof AksiError) {
        return {
          ok: false,
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
        };
      }

      // Error tak terduga dicatat di server, pesannya tetap generik ke admin.
      console.error("[admin-action] kegagalan tak terduga:", error);
      return {
        ok: false,
        code: "server",
        message:
          "Terjadi kesalahan di server. Perubahan tidak tersimpan. Coba lagi beberapa saat.",
      };
    }

    // 4. Revalidasi. Kegagalan di sini TIDAK membatalkan perubahan yang
    //    sudah tersimpan — admin hanya diberi tahu bahwa halaman publik
    //    mungkin perlu beberapa saat untuk ikut berubah.
    let peringatan: string | undefined;
    const entitas =
      typeof opsi.revalidasi === "function"
        ? opsi.revalidasi(data, hasil)
        : opsi.revalidasi;

    if (entitas) {
      try {
        revalidasiUntuk(entitas, opsi.konteks?.(data, hasil) ?? {});
      } catch (error) {
        console.error("[admin-action] revalidasi gagal:", error);
        peringatan =
          "Perubahan sudah tersimpan, tetapi halaman publik mungkin perlu beberapa saat untuk ikut berubah.";
      }
    }

    const message =
      typeof opsi.sukses === "function" ? opsi.sukses(data, hasil) : opsi.sukses;

    return { ok: true, message, data: hasil, peringatan };
  };
}
