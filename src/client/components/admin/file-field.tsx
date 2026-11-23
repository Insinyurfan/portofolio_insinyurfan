"use client";

import { Trash2, Upload } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toastGagal } from "@/client/components/admin/toaster";
import { keWebp } from "@/client/lib/ke-webp";
import { unggahMedia } from "@/client/lib/unggah-media";
import { Button } from "@/client/components/admin/ui";
import { unggahAction } from "@/server/actions/konten";
import type { PrefiksMedia } from "@/server/actions/storage";
import { siapkanUnggahMediaAction } from "@/server/actions/unggah-media";

/**
 * Field unggah berkas dengan pratinjau.
 *
 * Tiga keadaan yang diminta spesifikasi:
 *   1. pratinjau gambar yang sedang berlaku
 *   2. pratinjau berkas yang baru dipilih, SEBELUM form disimpan
 *      (dipakai URL objek lokal, jadi terlihat seketika)
 *   3. keadaan sedang mengunggah, yang menahan tombol simpan form
 *
 * Unggahan terjadi saat berkas dipilih, bukan saat form disimpan. Berkas lama
 * baru dihapus di aksi simpan — setelah baris database yang menunjuk berkas
 * baru berhasil tersimpan.
 */
export function FileField({
  label,
  nilai,
  prefiks,
  jenis = "gambar",
  unggahLangsung = false,
  disabled = false,
  hint,
  onChange,
  onSedangMengunggah,
}: {
  label: string;
  nilai: string | null;
  prefiks: PrefiksMedia;
  jenis?: "gambar" | "pdf";
  unggahLangsung?: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (url: string | null) => void;
  onSedangMengunggah?: (sedang: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const unggahan = useRef<AbortController | null>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [pratinjauLokal, setPratinjauLokal] = useState<string | null>(null);

  useEffect(() => () => {
    if (unggahan.current) {
      unggahan.current.abort();
      onSedangMengunggah?.(false);
    }
  }, [onSedangMengunggah]);
  useEffect(() => {
    if (pratinjauLokal) return () => URL.revokeObjectURL(pratinjauLokal);
  }, [pratinjauLokal]);

  const accept =
    jenis === "pdf"
      ? "application/pdf"
      : "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";

  function setStatus(sedang: boolean) {
    setMengunggah(sedang);
    onSedangMengunggah?.(sedang);
  }

  async function pilihBerkas(dipilih: File) {
    if (disabled || unggahan.current) return;
    const controller = new AbortController();
    unggahan.current = controller;
    // Pratinjau lokal tampil seketika, sebelum unggahan selesai.
    if (jenis === "gambar") {
      setPratinjauLokal(URL.createObjectURL(dipilih));
    }

    setStatus(true);

    // JPEG dan PNG dikonversi ke WebP di peramban lebih dulu, sehingga yang
    // melintasi jaringan dan tersimpan di Storage sudah berukuran kecil.
    // keWebp mengembalikan berkas aslinya bila konversi tidak menguntungkan
    // atau tidak didukung, jadi langkah ini tidak pernah menggagalkan unggahan.
    try {
      const file = jenis === "gambar" ? await keWebp(dipilih) : dipilih;
      if (controller.signal.aborted) return;
      if (unggahLangsung) {
        const hasil = await siapkanUnggahMediaAction({ type: file.type, size: file.size, prefiks, jenis });
        if (!hasil.ok) throw new Error(hasil.message);
        if (!hasil.data) throw new Error("Unggahan tidak dapat disiapkan.");
        await unggahMedia(file, hasil.data.urlUnggah, controller.signal);
        if (!controller.signal.aborted) onChange(hasil.data.urlPublik);
      } else {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("prefiks", prefiks);
        formData.set("jenis", jenis);
        const hasil = await unggahAction(formData);
        if (!hasil.ok) throw new Error(hasil.message);
        if (!controller.signal.aborted && hasil.data) onChange(hasil.data.url);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        toastGagal(error instanceof Error ? error.message : "Berkas gagal diunggah.");
      }
    } finally {
      unggahan.current = null;
      if (!controller.signal.aborted) {
        setStatus(false);
        setPratinjauLokal(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }

  const sumberPratinjau = pratinjauLokal ?? nilai;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-adm-fg">{label}</p>

      <div className="flex flex-wrap items-start gap-3">
        {jenis === "gambar" ? (
          <div className="relative size-24 shrink-0 overflow-hidden rounded-adm border border-adm-border bg-adm-panel-muted">
            {sumberPratinjau ? (
              // next/image tidak dipakai untuk pratinjau lokal (blob:), dan
              // untuk konsistensi juga tidak untuk pratinjau tersimpan — ini
              // hanya thumbnail kecil di dashboard, bukan halaman publik.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sumberPratinjau}
                alt={`Pratinjau ${label}`}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xs text-adm-fg-subtle">
                Kosong
              </span>
            )}
          </div>
        ) : nilai ? (
          <a
            href={nilai}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-adm-primary underline-offset-2 hover:underline"
          >
            Lihat berkas yang tersimpan
          </a>
        ) : (
          <span className="text-sm text-adm-fg-subtle">Belum ada berkas</span>
        )}

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={disabled || mengunggah}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pilihBerkas(file);
            }}
            aria-label={label}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || mengunggah}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              {mengunggah ? "Mengunggah…" : nilai ? "Ganti berkas" : "Pilih berkas"}
            </Button>

            {nilai ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled || mengunggah}
                className="text-adm-danger hover:bg-adm-danger-soft"
                onClick={() => onChange(null)}
                // Label menyebut field-nya. Halaman profil punya tiga field
                // berkas sekaligus — logo, foto, dan CV — sehingga tiga tombol
                // bernama "Hapus" saja tidak dapat dibedakan oleh pengguna
                // pembaca layar, dan tidak dapat disasar dengan pasti dari
                // pengujian.
                aria-label={`Hapus ${label}`}
              >
                <Trash2 aria-hidden="true" />
                Hapus
              </Button>
            ) : null}
          </div>

          {hint ? <p className="text-xs text-adm-fg-subtle">{hint}</p> : null}

          {/* Dijelaskan sekali di sini, bukan diulang di setiap hint field. */}
          {jenis === "gambar" ? (
            <p className="text-xs text-adm-fg-subtle">
              JPG dan PNG otomatis diubah ke WebP dan diperkecil bila lebih dari
              1600 piksel, supaya ukurannya jauh lebih ringan tanpa perbedaan
              yang terlihat. SVG, GIF, dan AVIF dibiarkan apa adanya.
            </p>
          ) : null}

          {mengunggah ? (
            <p role="status" className="text-xs text-adm-fg-muted">
              Sedang mengunggah, tunggu sebentar…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
