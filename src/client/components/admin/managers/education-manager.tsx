"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { GalleryField } from "@/client/components/admin/gallery-field";
import { StringListField } from "@/client/components/admin/managers/string-list-field";
import { ItemList } from "@/client/components/admin/item-list";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanPendidikanAction } from "@/server/actions/konten";
import { educationSchema } from "@/shared/schemas";
import { formatRentangTahun } from "@/shared/format";
import type { Education } from "@/shared/types";

type Nilai = z.input<typeof educationSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof educationSchema>;

const KOSONG: Nilai = {
  id: null,
  institution: "",
  major: "",
  degree: "",
  location: "",
  logo_url: "",
  focus_items: [],
  activity_items: [],
  gallery: [],
  website_url: "",
  start_year: new Date().getFullYear(),
  end_year: "",
  gpa: "",
  description: "",
  sort_order: 0,
  is_published: true,
};

export function EducationManager({ items }: { items: Education[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [terbuka, setTerbuka] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(educationSchema),
    defaultValues: KOSONG,
  });
  const { register, handleSubmit, reset, setError, control, formState, getValues } =
    form;

  function buka(item?: Education) {
    reset(
      item
        ? {
            id: item.id,
            institution: item.institution,
            major: item.major ?? "",
            degree: item.degree ?? "",
            location: item.location ?? "",
            logo_url: item.logo_url ?? "",
            focus_items: item.focus_items,
            activity_items: item.activity_items,
            gallery: item.gallery,
            website_url: item.website_url ?? "",
            start_year: item.start_year,
            end_year: item.end_year ?? "",
            gpa: item.gpa ?? "",
            description: item.description ?? "",
            sort_order: item.sort_order,
            is_published: item.is_published,
          }
        : { ...KOSONG, sort_order: items.length + 1 },
    );
    setTerbuka(true);
  }

  async function simpan() {
    // Nilai MENTAH form: server yang mem-parse dan mentransformnya.
    const nilai = getValues();

    const ok = await jalankan(() => simpanPendidikanAction(nilai), {
      onFieldError: (fields) => {
        for (const [k, p] of Object.entries(fields)) {
          setError(k as keyof Nilai, { message: p });
        }
      },
    });
    if (ok) {
      setTerbuka(false);
      reset(KOSONG);
    }
  }

  return (
    <div className="space-y-4">
      {terbuka ? (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-adm-fg">
              {getValues("id") ? "Sunting pendidikan" : "Pendidikan baru"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTerbuka(false)}
              aria-label="Tutup form"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(() => simpan())} noValidate className="space-y-4">
            <Field
              id="institution"
              label="Institusi"
              required
              error={formState.errors.institution?.message}
            >
              {(a) => <Input {...a} {...register("institution")} />}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="major"
                label="Jurusan"
                error={formState.errors.major?.message}
              >
                {(a) => <Input {...a} {...register("major")} />}
              </Field>
              <Field
                id="degree"
                label="Jenjang"
                hint="Misalnya S1, D3, SMA."
                error={formState.errors.degree?.message}
              >
                {(a) => <Input {...a} {...register("degree")} />}
              </Field>
            </div>

            <Field
              id="location"
              label="Lokasi"
              hint="Ditampilkan di kartu beserta ikon lokasi. Misalnya: Bekasi, Jawa Barat."
              error={formState.errors.location?.message}
            >
              {(a) => <Input {...a} {...register("location")} />}
            </Field>

            <Controller
              control={control}
              name="logo_url"
              render={({ field }) => (
                <FileField
                  label="Logo institusi"
                  nilai={field.value ?? null}
                  prefiks="education"
                  hint="Tampil di kartu pendidikan. Rasio apa pun boleh — gambar disesuaikan tanpa terpotong. Dikosongkan berarti kartu memakai inisial nama institusi."
                  onChange={(url) => field.onChange(url ?? "")}
                  onSedangMengunggah={setMengunggah}
                />
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="start_year"
                label="Tahun mulai"
                required
                error={formState.errors.start_year?.message}
              >
                {(a) => <Input {...a} {...register("start_year")} type="number" />}
              </Field>
              <Field
                id="end_year"
                label="Tahun selesai"
                hint="Kosongkan bila masih berjalan."
                error={formState.errors.end_year?.message}
              >
                {(a) => <Input {...a} {...register("end_year")} type="number" />}
              </Field>
              <Field
                id="gpa"
                label="IPK"
                hint="Opsional, 0–4."
                error={formState.errors.gpa?.message}
              >
                {(a) => (
                  <Input {...a} {...register("gpa")} type="number" step="0.01" />
                )}
              </Field>
            </div>

            <Field
              id="description"
              label="Deskripsi"
              error={formState.errors.description?.message}
            >
              {(a) => <Textarea {...a} {...register("description")} />}
            </Field>

            <Field
              id="website_url"
              label="Situs resmi institusi"
              hint="Tombol “Kunjungi situs institusi” di dialog detail mengarah ke sini. Dikosongkan berarti tombolnya tidak dirender."
              error={formState.errors.website_url?.message}
            >
              {(a) => (
                <Input {...a} {...register("website_url")} placeholder="https://…" />
              )}
            </Field>

            <Controller
              control={control}
              name="focus_items"
              render={({ field }) => (
                <StringListField
                  label="Fokus pembelajaran"
                  nilai={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Misalnya: Rekayasa Perangkat Lunak"
                  hint="Satu baris per poin, tampil di dialog detail. Kosong berarti bagiannya tidak dirender."
                />
              )}
            />

            <Controller
              control={control}
              name="activity_items"
              render={({ field }) => (
                <StringListField
                  label="Aktivitas & pencapaian"
                  nilai={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Misalnya: Anggota himpunan mahasiswa"
                  hint="Satu baris per poin, tampil di dialog detail."
                />
              )}
            />

            <Controller
              control={control}
              name="gallery"
              render={({ field }) => (
                <GalleryField
                  label="Dokumentasi pendidikan"
                  nilai={field.value ?? []}
                  prefiks="education"
                  onChange={field.onChange}
                  onSedangMengunggah={setMengunggah}
                  hint="Tiga foto pertama tampil sebagai cuplikan di kartu; semuanya tampil di dialog detail."
                />
              )}
            />

            <label className="flex items-center gap-2 text-sm text-adm-fg">
              <Checkbox {...register("is_published")} />
              Tampilkan di halaman publik
            </label>

            <div className="flex gap-2">
              {/* Ikut nonaktif selama logo masih diunggah: menyimpan di
                  tengah unggahan akan menyimpan baris tanpa logonya. */}
              <Button type="submit" disabled={sedangBerjalan || mengunggah}>
                {sedangBerjalan ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setTerbuka(false)}
                disabled={sedangBerjalan}
              >
                Batal
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button onClick={() => buka()}>
          <Plus aria-hidden="true" />
          Tambah pendidikan
        </Button>
      )}

      <ItemList
        tabel="education"
        items={items.map((i) => ({
          id: i.id,
          judul: i.institution,
          keterangan: [
            [i.degree, i.major].filter(Boolean).join(" · "),
            formatRentangTahun(i.start_year, i.end_year),
          ]
            .filter(Boolean)
            .join(" — "),
          is_published: i.is_published,
        }))}
        onSunting={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) buka(item);
        }}
        emptyTitle="Belum ada riwayat pendidikan"
        emptyDescription="Tambahkan jenjang pendidikan Anda agar timeline di halaman Pendidikan terisi."
        emptyAction={<Button onClick={() => buka()}>Tambah pendidikan</Button>}
      />
    </div>
  );
}
