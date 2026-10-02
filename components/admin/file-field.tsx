"use client";

import { Trash2, Upload } from "lucide-react";

import { useRef, useState } from "react";

import { toastGagal } from "@/components/admin/toaster";
import { Button } from "@/components/admin/ui";
import { unggahAction } from "@/app/admin/actions-content";
import type { PrefiksMedia } from "@/lib/admin/storage";

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
  hint,
  onChange,
  onSedangMengunggah,
}: {
  label: string;
  nilai: string | null;
  prefiks: PrefiksMedia;
  jenis?: "gambar" | "pdf";
  hint?: string;
  onChange: (url: string | null) => void;
  onSedangMengunggah?: (sedang: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [pratinjauLokal, setPratinjauLokal] = useState<string | null>(null);

  const accept =
    jenis === "pdf"
      ? "application/pdf"
      : "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";

  function setStatus(sedang: boolean) {
    setMengunggah(sedang);
    onSedangMengunggah?.(sedang);
  }

  async function pilihBerkas(file: File) {
    // Pratinjau lokal tampil seketika, sebelum unggahan selesai.
    if (jenis === "gambar") {
      setPratinjauLokal(URL.createObjectURL(file));
    }

    setStatus(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("prefiks", prefiks);
    formData.set("jenis", jenis);

    const hasil = await unggahAction(formData);
    setStatus(false);

    if (!hasil.ok) {
      // Berkas ditolak: field tetap merujuk gambar sebelumnya.
      setPratinjauLokal(null);
      toastGagal(hasil.message);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setPratinjauLokal(null);
    onChange(hasil.data?.url ?? null);
    if (inputRef.current) inputRef.current.value = "";
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
              disabled={mengunggah}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              {mengunggah ? "Mengunggah…" : nilai ? "Ganti berkas" : "Pilih berkas"}
            </Button>

            {nilai ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={mengunggah}
                className="text-adm-danger hover:bg-adm-danger-soft"
                onClick={() => onChange(null)}
              >
                <Trash2 aria-hidden="true" />
                Hapus
              </Button>
            ) : null}
          </div>

          {hint ? <p className="text-xs text-adm-fg-subtle">{hint}</p> : null}

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
