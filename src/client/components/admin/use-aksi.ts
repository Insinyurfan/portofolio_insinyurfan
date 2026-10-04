"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { toastGagal, toastPeringatan, toastSukses } from "@/client/components/admin/toaster";
import type { HasilAksi } from "@/server/actions/admin";

/**
 * Menjalankan satu aksi admin dengan perilaku yang sama di seluruh dashboard:
 *
 *   - mengunci selama berjalan, sehingga klik ganda tidak menggandakan data
 *   - toast sukses / gagal, dengan toast gagal bertahan lebih lama
 *   - sesi berakhir ditangani khusus: pesannya jelas dan admin diarahkan ke
 *     halaman login TANPA melepas form, jadi isian yang sudah diketik tidak
 *     hilang begitu saja
 *   - menyegarkan data server setelah aksi berhasil
 */
export function useAksi() {
  const router = useRouter();
  const [sedangBerjalan, setSedangBerjalan] = useState(false);

  const jalankan = useCallback(
    async <T>(
      aksi: () => Promise<HasilAksi<T>>,
      opsi: {
        onSukses?: (hasil: Extract<HasilAksi<T>, { ok: true }>) => void;
        onFieldError?: (fieldErrors: Record<string, string>) => void;
        /** Jangan refresh router — dipakai saat pemanggil mengurusnya sendiri. */
        tanpaRefresh?: boolean;
      } = {},
    ): Promise<boolean> => {
      if (sedangBerjalan) return false;
      setSedangBerjalan(true);

      try {
        const hasil = await aksi();

        if (hasil.ok) {
          toastSukses(hasil.message);
          if (hasil.peringatan) toastPeringatan(hasil.peringatan);
          opsi.onSukses?.(hasil);
          if (!opsi.tanpaRefresh) router.refresh();
          return true;
        }

        if (hasil.code === "sesi-berakhir" || hasil.code === "bukan-admin") {
          toastGagal(hasil.message, "Anda akan diarahkan ke halaman masuk.");
          // Isian form sengaja tidak disentuh: form tetap terpasang, jadi
          // yang sudah diketik masih ada kalau admin kembali.
          setTimeout(() => router.push("/admin/login"), 1200);
          return false;
        }

        if (hasil.code === "validasi" || hasil.code === "konflik") {
          toastGagal(hasil.message);
          if (hasil.fieldErrors) opsi.onFieldError?.(hasil.fieldErrors);
          return false;
        }

        toastGagal(hasil.message);
        return false;
      } catch (error) {
        console.error("[useAksi]", error);
        toastGagal(
          "Aksi gagal dijalankan.",
          "Periksa koneksi internet Anda lalu coba lagi.",
        );
        return false;
      } finally {
        setSedangBerjalan(false);
      }
    },
    [router, sedangBerjalan],
  );

  return { jalankan, sedangBerjalan };
}
