"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanPembukaHalamanAction } from "@/server/actions/konten";
import { pageIntroSchema } from "@/shared/schemas";
import type { PageIntro } from "@/shared/types";

type Nilai = z.input<typeof pageIntroSchema>;
type Keluaran = z.output<typeof pageIntroSchema>;

/** Nama halaman sebagaimana dikenal pemilik, bukan kunci teknisnya. */
const NAMA_HALAMAN: Record<string, string> = {
  tentang: "Tentang",
  pendidikan: "Pendidikan",
  keahlian: "Keahlian",
  pengalaman: "Pengalaman",
  proyek: "Proyek",
  pencapaian: "Pencapaian",
  kontak: "Kontak",
};

/**
 * Pengelola blok pembuka setiap halaman publik.
 *
 * Satu form per halaman, bukan daftar dengan dialog: jumlah halamannya tetap
 * dan sedikit, sehingga membuka dialog untuk menyunting satu paragraf hanya
 * menambah langkah tanpa menambah kejelasan.
 */
export function PageIntrosManager({ items }: { items: PageIntro[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FormSatuHalaman key={item.id} item={item} />
      ))}
    </div>
  );
}

function FormSatuHalaman({ item }: { item: PageIntro }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [terbuka, setTerbuka] = useState(false);

  const { register, handleSubmit, setError, formState, getValues } = useForm<
    Nilai,
    unknown,
    Keluaran
  >({
    resolver: zodResolver(pageIntroSchema),
    defaultValues: {
      id: item.id,
      page: item.page as Nilai["page"],
      eyebrow: item.eyebrow ?? "",
      headline: item.headline ?? "",
      description: item.description ?? "",
      is_published: item.is_published,
    },
  });

  const nama = NAMA_HALAMAN[item.page] ?? item.page;
  const terisi = item.headline !== null && item.headline.trim() !== "";

  return (
    <Panel>
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-adm-fg">{nama}</span>
          <span className="mt-0.5 block truncate text-sm text-adm-fg-muted">
            {terisi ? item.headline : "Belum diisi — pembuka tidak dirender"}
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-adm-fg-muted">
          {terbuka ? "▲" : "▼"}
        </span>
      </button>

      {terbuka ? (
        <form
          onSubmit={handleSubmit(async () => {
            await jalankan(() => simpanPembukaHalamanAction(getValues()), {
              onFieldError: (f) => {
                for (const [k, pesan] of Object.entries(f))
                  setError(k as keyof Nilai, { message: pesan });
              },
            });
          })}
          noValidate
          className="mt-5 space-y-4 border-t border-adm-border pt-5"
        >
          <Field
            id={`eyebrow-${item.page}`}
            label="Label kecil"
            hint="Tampil di atas judul pembuka, dengan huruf kapital. Misalnya: Perjalanan."
            error={formState.errors.eyebrow?.message}
          >
            {(a) => <Input {...a} {...register("eyebrow")} />}
          </Field>

          <Field
            id={`headline-${item.page}`}
            label="Judul pembuka"
            hint="Kalimat besar di blok pembuka. DIKOSONGKAN berarti blok pembukanya tidak dirender sama sekali, dan halaman kembali ke bentuk biasa."
            error={formState.errors.headline?.message}
          >
            {(a) => <Input {...a} {...register("headline")} />}
          </Field>

          <Field
            id={`description-${item.page}`}
            label="Deskripsi pembuka"
            hint="Satu paragraf singkat di bawah judul pembuka."
            error={formState.errors.description?.message}
          >
            {(a) => <Textarea {...a} {...register("description")} rows={3} />}
          </Field>

          <label className="flex items-center gap-2 text-sm text-adm-fg">
            <Checkbox {...register("is_published")} />
            Tampilkan pembuka ini di halaman publik
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={sedangBerjalan}>
              {sedangBerjalan ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTerbuka(false)}
            >
              Tutup
            </Button>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}
