"use client";

import { useState } from "react";

import { StringListField } from "@/client/components/admin/managers/string-list-field";
import { toastGagal } from "@/client/components/admin/toaster";
import { keWebp } from "@/client/lib/ke-webp";
import { unggahAction } from "@/server/actions/konten";
import type { PrefiksMedia } from "@/server/actions/storage";

/**
 * Field galeri: daftar URL yang dapat diurutkan, beserta unggah banyak berkas.
 *
 * Dikumpulkan jadi satu komponen karena jalur ini dipakai di tiga tempat —
 * proyek, pendidikan, dan pengalaman. Versi sebelumnya hanya ada di manager
 * proyek, dan menyalinnya berarti konversi WebP serta penanganan error harus
 * diingat di setiap salinan.
 */
export function GalleryField({
  label,
  nilai,
  prefiks,
  hint,
  onChange,
  onSedangMengunggah,
}: {
  label: string;
  nilai: string[];
  prefiks: PrefiksMedia;
  hint?: string;
  onChange: (nilai: string[]) => void;
  onSedangMengunggah?: (sedang: boolean) => void;
}) {
  const [mengunggah, setMengunggah] = useState(false);

  function setStatus(sedang: boolean) {
    setMengunggah(sedang);
    onSedangMengunggah?.(sedang);
  }

  async function tambahBanyak(files: FileList) {
    setStatus(true);
    const urlBaru: string[] = [];

    for (const dipilih of Array.from(files)) {
      // Dikonversi ke WebP lebih dulu, sama seperti unggahan berkas tunggal.
      // Untuk galeri penghematannya paling terasa: satu entri bisa memuat
      // sepuluh foto kamera sekaligus.
      const file = await keWebp(dipilih);

      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefiks", prefiks);
      fd.set("jenis", "gambar");

      const hasil = await unggahAction(fd);
      if (hasil.ok && hasil.data) urlBaru.push(hasil.data.url);
      else if (!hasil.ok) toastGagal(`${dipilih.name}: ${hasil.message}`);
    }

    // Yang berhasil tetap ditambahkan meski ada yang gagal — pemilik tidak
    // perlu mengulang seluruh pilihan hanya karena satu berkas ditolak.
    if (urlBaru.length > 0) onChange([...nilai, ...urlBaru]);
    setStatus(false);
  }

  return (
    <div className="space-y-2">
      <StringListField
        label={label}
        nilai={nilai}
        onChange={onChange}
        placeholder="https://…"
        hint={hint ?? "Urutan di sini adalah urutan yang tampil di halaman."}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-adm-primary">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={mengunggah}
          onChange={(event) => {
            if (event.target.files?.length) {
              void tambahBanyak(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <span className="underline-offset-2 hover:underline">
          {mengunggah ? "Mengunggah…" : "Atau unggah beberapa gambar →"}
        </span>
      </label>

      <p className="text-xs text-adm-fg-subtle">
        JPG dan PNG otomatis diubah ke WebP dan diperkecil bila lebih dari 1600
        piksel. Bisa memilih beberapa berkas sekaligus.
      </p>
    </div>
  );
}
