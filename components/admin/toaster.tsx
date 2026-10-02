"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

/**
 * Notifikasi toast.
 *
 * Dua hal yang diminta spesifikasi dan ditangani di sini:
 *   - isinya diumumkan ke teknologi bantu tanpa memindahkan fokus
 *     (sonner memakai region aria-live, fokus admin tidak terganggu)
 *   - toast kegagalan bertahan lebih lama daripada toast keberhasilan
 */

const DURASI_SUKSES = 3500;
const DURASI_GAGAL = 8000;

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-adm !border !border-adm-border !bg-adm-panel !text-adm-fg",
          description: "!text-adm-fg-muted",
          actionButton: "!bg-adm-primary !text-adm-primary-fg",
        },
      }}
    />
  );
}

export function toastSukses(pesan: string, keterangan?: string) {
  toast.success(pesan, { description: keterangan, duration: DURASI_SUKSES });
}

export function toastGagal(pesan: string, keterangan?: string) {
  toast.error(pesan, { description: keterangan, duration: DURASI_GAGAL });
}

/** Perubahan tersimpan tetapi ada catatan — misalnya revalidasi gagal. */
export function toastPeringatan(pesan: string, keterangan?: string) {
  toast.warning(pesan, { description: keterangan, duration: DURASI_GAGAL });
}
