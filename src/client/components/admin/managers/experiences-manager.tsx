"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { GalleryField } from "@/client/components/admin/gallery-field";
import { ItemList } from "@/client/components/admin/item-list";
import { StringListField } from "@/client/components/admin/managers/string-list-field";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Select,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanPengalamanAction } from "@/server/actions/konten";
import { experienceSchema } from "@/shared/schemas";
import { formatRentangTanggal, labelExperienceType } from "@/shared/format";
import type { Experience, ExperienceType } from "@/shared/types";

type Nilai = z.input<typeof experienceSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof experienceSchema>;

const TIPE: ExperienceType[] = ["work", "internship", "organization", "freelance"];

const KOSONG: Nilai = {
  id: null,
  position: "",
  organization: "",
  type: "work",
  start_date: "",
  end_date: "",
  is_ongoing: false,
  description: "",
  location: "",
  logo_url: "",
  highlights: [],
  gallery: [],
  website_url: "",
  sort_order: 0,
  is_published: true,
};

export function ExperiencesManager({ items }: { items: Experience[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [terbuka, setTerbuka] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(experienceSchema),
    defaultValues: KOSONG,
  });
  const { register, handleSubmit, reset, setError, formState, getValues, control } =
    form;

  // Masih berjalan → field tanggal selesai dinonaktifkan, sesuai spesifikasi.
  // useWatch, bukan watch(): watch() mengembalikan nilai yang tidak dapat
  // dimemoisasi React Compiler, dan itu memicu peringatan kompilasi.
  const masihBerjalan = useWatch({ control, name: "is_ongoing" });

  function buka(item?: Experience) {
    reset(
      item
        ? {
            id: item.id,
            position: item.position,
            organization: item.organization,
            type: item.type,
            start_date: item.start_date,
            end_date: item.end_date ?? "",
            is_ongoing: item.is_ongoing,
            description: item.description ?? "",
            location: item.location ?? "",
            logo_url: item.logo_url ?? "",
            highlights: item.highlights,
            gallery: item.gallery,
            website_url: item.website_url ?? "",
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

    const ok = await jalankan(() => simpanPengalamanAction(nilai), {
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
              {getValues("id") ? "Sunting pengalaman" : "Pengalaman baru"}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="position"
                label="Posisi"
                required
                error={formState.errors.position?.message}
              >
                {(a) => <Input {...a} {...register("position")} />}
              </Field>
              <Field
                id="organization"
                label="Instansi"
                required
                error={formState.errors.organization?.message}
              >
                {(a) => <Input {...a} {...register("organization")} />}
              </Field>
            </div>

            <Field
              id="type"
              label="Tipe"
              required
              error={formState.errors.type?.message}
            >
              {(a) => (
                <Select {...a} {...register("type")}>
                  {TIPE.map((t) => (
                    <option key={t} value={t}>
                      {labelExperienceType(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <label className="flex items-center gap-2 text-sm text-adm-fg">
              <Checkbox {...register("is_ongoing")} />
              Masih berjalan sampai sekarang
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="start_date"
                label="Tanggal mulai"
                required
                error={formState.errors.start_date?.message}
              >
                {(a) => <Input {...a} {...register("start_date")} type="date" />}
              </Field>
              <Field
                id="end_date"
                label="Tanggal selesai"
                hint={
                  Boolean(masihBerjalan)
                    ? "Dinonaktifkan karena pengalaman ini masih berjalan."
                    : "Kosongkan bila tidak ada."
                }
                error={formState.errors.end_date?.message}
              >
                {(a) => (
                  <Input
                    {...a}
                    {...register("end_date")}
                    type="date"
                    disabled={Boolean(masihBerjalan)}
                  />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="location"
                label="Lokasi"
                hint="Misalnya: Jakarta Timur, DKI Jakarta."
                error={formState.errors.location?.message}
              >
                {(a) => <Input {...a} {...register("location")} />}
              </Field>
              <Field
                id="website_url"
                label="Situs resmi organisasi"
                hint="Tombol kunjungi di dialog detail mengarah ke sini."
                error={formState.errors.website_url?.message}
              >
                {(a) => (
                  <Input {...a} {...register("website_url")} placeholder="https://…" />
                )}
              </Field>
            </div>

            <Controller
              control={control}
              name="logo_url"
              render={({ field }) => (
                <FileField
                  label="Logo organisasi"
                  nilai={field.value ?? null}
                  prefiks="experiences"
                  hint="Tampil di kartu pengalaman. Dikosongkan berarti kartu memakai inisial nama organisasi."
                  onChange={(url) => field.onChange(url ?? "")}
                  onSedangMengunggah={setMengunggah}
                />
              )}
            />

            <Controller
              control={control}
              name="highlights"
              render={({ field }) => (
                <StringListField
                  label="Kontribusi"
                  nilai={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Misalnya: Mengelola publikasi dan dokumentasi kegiatan"
                  hint="Satu baris per poin, tampil di dialog detail. Kosong berarti bagiannya tidak dirender."
                />
              )}
            />

            <Controller
              control={control}
              name="gallery"
              render={({ field }) => (
                <GalleryField
                  label="Dokumentasi"
                  nilai={field.value ?? []}
                  prefiks="experiences"
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
              {/* Ikut nonaktif selama berkas masih diunggah: menyimpan di
                  tengah unggahan akan menyimpan baris tanpa berkasnya. */}
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
          Tambah pengalaman
        </Button>
      )}

      <ItemList
        tabel="experiences"
        items={items.map((i) => ({
          id: i.id,
          judul: i.position,
          keterangan: `${i.organization} — ${formatRentangTanggal(
            i.start_date,
            i.end_date,
            i.is_ongoing,
          )}`,
          is_published: i.is_published,
          penanda: <Badge>{labelExperienceType(i.type)}</Badge>,
        }))}
        onSunting={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) buka(item);
        }}
        emptyTitle="Belum ada pengalaman"
        emptyDescription="Tambahkan pengalaman kerja, magang, organisasi, atau freelance Anda."
        emptyAction={<Button onClick={() => buka()}>Tambah pengalaman</Button>}
      />
    </div>
  );
}
