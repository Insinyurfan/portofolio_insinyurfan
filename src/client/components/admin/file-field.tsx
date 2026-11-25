"use client";

import { Trash2, Upload } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toastGagal } from "@/client/components/admin/toaster";
import { siapkanFoto } from "@/client/lib/siapkan-foto";
import { unggahMedia } from "@/client/lib/unggah-media";
import { Button } from "@/client/components/admin/ui";
import { unggahAction } from "@/server/actions/konten";
import type { PrefiksMedia } from "@/server/actions/storage";
import { siapkanUnggahMediaAction } from "@/server/actions/unggah-media";
import { cn } from "@/shared/cn";
import { PILIH_FOTO } from "@/shared/media";

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
  const urlPratinjau = useRef<string | null>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [pratinjauLokal, setPratinjauLokal] = useState<string | null>(null);
  const unggahLogo = prefiks === "logo" || prefiks === "issuer-logos";

  useEffect(() => () => {
    if (unggahan.current) {
      unggahan.current.abort();
      onSedangMengunggah?.(false);
    }
    if (urlPratinjau.current) URL.revokeObjectURL(urlPratinjau.current);
  }, [onSedangMengunggah]);

  const accept = jenis === "pdf" ? "application/pdf" : PILIH_FOTO;

  function tampilkanPratinjau(file?: File) {
    if (urlPratinjau.current) URL.revokeObjectURL(urlPratinjau.current);
    urlPratinjau.current = file ? URL.createObjectURL(file) : null;
    setPratinjauLokal(urlPratinjau.current);
  }

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
      tampilkanPratinjau(dipilih);
    }

    setStatus(true);

    try {
      const file = jenis === "gambar"
        ? await siapkanFoto(dipilih, { pertahankanFormat: unggahLogo })
        : dipilih;
      if (controller.signal.aborted) return;
      if (file !== dipilih) tampilkanPratinjau(file);
      if (jenis === "gambar" || unggahLangsung) {
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
        tampilkanPratinjau();
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
                className={cn("size-full", unggahLogo ? "object-contain" : "object-cover")}
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

          {jenis === "gambar" ? (
            <p className="text-xs text-adm-fg-subtle">
              {unggahLogo
                ? "PNG transparan dan format web lainnya diunggah dalam format asli. HEIC/HEIF, TIFF, dan BMP dikonversi ke PNG."
                : "Foto seperti HEIC/HEIF, TIFF, dan BMP dikonversi otomatis saat dipilih."}
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
