"use client";

import { Check, ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { StringListField } from "@/client/components/admin/managers/string-list-field";
import { keWebp } from "@/client/lib/ke-webp";
import { unggahMedia } from "@/client/lib/unggah-media";
import type { PrefiksMedia } from "@/server/actions/storage";
import { siapkanUnggahMediaAction } from "@/server/actions/unggah-media";
import { cn } from "@/shared/cn";

const LABEL_STATUS = {
  menunggu: "Menunggu giliran",
  menyiapkan: "Menyiapkan",
  mengunggah: "Mengunggah",
  selesai: "Terunggah",
  gagal: "Gagal",
};

type FotoUnggahan = {
  nama: string;
  pratinjau: string;
  status: keyof typeof LABEL_STATUS;
  persen: number;
  pesan?: string;
};

export function GalleryField({
  label,
  nilai,
  prefiks,
  hint,
  disabled = false,
  onChange,
  onSedangMengunggah,
}: {
  label: string;
  nilai: string[];
  prefiks: PrefiksMedia;
  hint?: string;
  disabled?: boolean;
  onChange: (nilai: string[]) => void;
  onSedangMengunggah?: (sedang: boolean) => void;
}) {
  const [mengunggah, setMengunggah] = useState(false);
  const [antrean, setAntrean] = useState<FotoUnggahan[]>([]);
  const unggahanAktif = useRef<AbortController | null>(null);
  const pratinjauAktif = useRef<string[]>([]);

  useEffect(() => () => {
    unggahanAktif.current?.abort();
    pratinjauAktif.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function tambahBanyak(files: File[]) {
    if (disabled || unggahanAktif.current || files.length === 0) return;
    const controller = new AbortController();
    unggahanAktif.current = controller;

    pratinjauAktif.current.forEach((url) => URL.revokeObjectURL(url));
    const pilihan = files.map((file): FotoUnggahan => ({
      nama: file.name,
      pratinjau: URL.createObjectURL(file),
      status: "menunggu",
      persen: 0,
    }));
    pratinjauAktif.current = pilihan.map((foto) => foto.pratinjau);
    setAntrean(pilihan);
    setMengunggah(true);
    onSedangMengunggah?.(true);

    function perbarui(index: number, perubahan: Partial<FotoUnggahan>) {
      setAntrean((sebelumnya) => sebelumnya.map(
        (foto, i) => i === index ? { ...foto, ...perubahan } : foto,
      ));
    }

    const urlBaru: string[] = [];
    try {
      for (const [index, dipilih] of files.entries()) {
        perbarui(index, { status: "menyiapkan" });
        try {
          const file = await keWebp(dipilih);
          if (controller.signal.aborted) return;

          const hasil = await siapkanUnggahMediaAction({
            type: file.type,
            size: file.size,
            prefiks,
            jenis: "gambar",
          });
          if (controller.signal.aborted) return;
          if (!hasil.ok) {
            perbarui(index, { status: "gagal", pesan: hasil.message });
            if (hasil.code === "sesi-berakhir" || hasil.code === "bukan-admin") {
              setAntrean((sebelumnya) => sebelumnya.map((foto) =>
                foto.status === "menunggu"
                  ? { ...foto, status: "gagal", pesan: hasil.message }
                  : foto,
              ));
              break;
            }
            continue;
          }
          if (!hasil.data) throw new Error("Unggahan tidak dapat disiapkan.");

          const { urlUnggah, urlPublik } = hasil.data;
          perbarui(index, { status: "mengunggah" });
          await unggahMedia(file, urlUnggah, controller.signal, (persen) =>
            perbarui(index, { persen }),
          );
          if (controller.signal.aborted) return;

          urlBaru.push(urlPublik);
          perbarui(index, { status: "selesai", persen: 100 });
        } catch (error) {
          if (controller.signal.aborted) return;
          perbarui(index, {
            status: "gagal",
            pesan: error instanceof Error && error.message
              ? error.message
              : "Berkas gagal diunggah. Coba pilih berkasnya lagi.",
          });
        }
      }

      if (urlBaru.length > 0) onChange([...nilai, ...urlBaru]);
    } finally {
      unggahanAktif.current = null;
      if (!controller.signal.aborted) {
        setMengunggah(false);
        onSedangMengunggah?.(false);
      }
    }
  }

  const jumlahSelesai = antrean.filter((foto) => foto.status === "selesai").length;
  const jumlahGagal = antrean.filter((foto) => foto.status === "gagal").length;

  return (
    <div className="space-y-3">
      <section aria-label={`Unggah ${label}`} className="space-y-3 rounded-adm border border-adm-border bg-adm-panel-muted p-3 sm:p-4">
        <p className="text-sm font-semibold text-adm-fg">{label}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="inline-flex items-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
              multiple
              className="peer sr-only"
              aria-label={`Pilih foto untuk ${label}`}
              disabled={disabled || mengunggah}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = "";
                void tambahBanyak(files);
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-adm border border-adm-border-strong bg-adm-panel px-3 py-2 text-sm font-medium text-adm-primary hover:border-adm-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-adm-ring peer-disabled:cursor-default peer-disabled:opacity-60">
              <Upload className="size-4" aria-hidden="true" />
              Pilih foto
            </span>
          </label>
          <p role="status" className="text-sm text-adm-fg-muted">
            {antrean.length > 0
              ? `${jumlahSelesai} dari ${antrean.length} foto terunggah${jumlahGagal > 0 ? ` · ${jumlahGagal} gagal` : ""}`
              : null}
          </p>
        </div>

        {antrean.length > 0 ? (
          <ol role="list" className="flex flex-wrap gap-3">
            {antrean.map((foto) => <KartuUnggahan key={foto.pratinjau} foto={foto} />)}
          </ol>
        ) : null}

        <p className="text-xs text-adm-fg-subtle">
          Bisa memilih beberapa foto. Maksimal 5 MB per foto setelah optimasi.
        </p>
      </section>

      <fieldset disabled={disabled || mengunggah} className="min-w-0">
        <StringListField
          label={`Tautan ${label.toLowerCase()}`}
          nilai={nilai}
          onChange={onChange}
          placeholder="https://…"
          hint={hint ?? "Urutan di sini adalah urutan yang tampil di halaman."}
        />
      </fieldset>
    </div>
  );
}

function KartuUnggahan({ foto }: { foto: FotoUnggahan }) {
  const aktif = foto.status === "menyiapkan" || foto.status === "mengunggah";
  const selesai = foto.status === "selesai";
  const gagal = foto.status === "gagal";
  const status = LABEL_STATUS[foto.status];

  return (
    <li className={cn(
      "w-24 max-w-full overflow-hidden rounded-adm border bg-adm-panel sm:w-28",
      aktif ? "border-adm-primary ring-1 ring-adm-primary" : "border-adm-border",
      gagal && "border-adm-danger",
    )}>
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-adm-panel-muted">
        <ImageIcon className="size-6 text-adm-fg-subtle" aria-hidden="true" />
        {/* Pratinjau lokal memakai URL blob yang tidak diproses oleh Next Image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.pratinjau}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
        <div
          role="progressbar"
          aria-label={foto.nama}
          aria-valuenow={foto.persen}
          aria-valuetext={`${foto.persen}% · ${status}`}
          className={cn(
            "absolute inset-0 grid place-items-center",
            aktif && "bg-black/65",
          )}
        >
          {aktif ? (
            <div className="relative grid size-12 place-items-center text-white">
              <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
              <span className="text-xs font-bold tabular-nums">{foto.persen}%</span>
            </div>
          ) : (
            <span className={cn(
              "absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold tabular-nums",
              selesai ? "bg-adm-primary text-adm-primary-fg" : "bg-adm-panel text-adm-fg",
              gagal && "bg-adm-danger text-adm-danger-fg",
            )}>
              {selesai ? <Check className="size-3" aria-hidden="true" /> : null}
              {gagal ? <X className="size-3" aria-hidden="true" /> : null}
              {foto.persen}%
            </span>
          )}
        </div>
      </div>
      <div className="space-y-0.5 px-2 py-1.5">
        <p title={foto.nama} className="truncate text-xs font-medium text-adm-fg">{foto.nama}</p>
        <p className={cn("text-xs", gagal ? "text-adm-danger" : "text-adm-fg-muted")}>
          {status}
        </p>
        {foto.pesan ? <p className="text-xs wrap-break-word text-adm-fg-muted">{foto.pesan}</p> : null}
      </div>
    </li>
  );
}
