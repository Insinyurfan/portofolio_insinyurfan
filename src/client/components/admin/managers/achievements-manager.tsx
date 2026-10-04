"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { ItemList } from "@/client/components/admin/item-list";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Select,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanPencapaianAction } from "@/server/actions/konten";
import { achievementSchema } from "@/shared/schemas";
import { formatTanggal, labelAchievementCategory } from "@/shared/format";
import type { Achievement, AchievementCategory } from "@/shared/types";

type Nilai = z.input<typeof achievementSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof achievementSchema>;

const KATEGORI: AchievementCategory[] = ["certificate", "award"];

const KOSONG: Nilai = {
  id: null,
  title: "",
  issuer: "",
  issued_date: "",
  category: "certificate",
  image_url: "",
  verification_url: "",
  sort_order: 0,
  is_published: true,
};

export function AchievementsManager({ items }: { items: Achievement[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [terbuka, setTerbuka] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(achievementSchema),
    defaultValues: KOSONG,
  });
  const { register, handleSubmit, reset, setError, formState, getValues, control } =
    form;

  function buka(item?: Achievement) {
    reset(
      item
        ? {
            id: item.id,
            title: item.title,
            issuer: item.issuer ?? "",
            issued_date: item.issued_date ?? "",
            category: item.category,
            image_url: item.image_url ?? "",
            verification_url: item.verification_url ?? "",
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

    const ok = await jalankan(() => simpanPencapaianAction(nilai), {
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
              {getValues("id") ? "Sunting pencapaian" : "Pencapaian baru"}
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
              id="title"
              label="Judul"
              required
              error={formState.errors.title?.message}
            >
              {(a) => <Input {...a} {...register("title")} />}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="issuer"
                label="Penerbit"
                error={formState.errors.issuer?.message}
              >
                {(a) => <Input {...a} {...register("issuer")} />}
              </Field>
              <Field
                id="issued_date"
                label="Tanggal"
                error={formState.errors.issued_date?.message}
              >
                {(a) => <Input {...a} {...register("issued_date")} type="date" />}
              </Field>
            </div>

            <Field
              id="category"
              label="Kategori"
              required
              error={formState.errors.category?.message}
            >
              {(a) => (
                <Select {...a} {...register("category")}>
                  {KATEGORI.map((k) => (
                    <option key={k} value={k}>
                      {labelAchievementCategory(k)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Controller
              control={control}
              name="image_url"
              render={({ field }) => (
                <FileField
                  label="Gambar sertifikat"
                  nilai={field.value ?? null}
                  prefiks="achievements"
                  hint="JPG, PNG, WebP, AVIF, GIF, atau SVG. Maksimal 5 MB."
                  onChange={(url) => field.onChange(url ?? "")}
                  onSedangMengunggah={setMengunggah}
                />
              )}
            />

            <Field
              id="verification_url"
              label="Tautan verifikasi"
              hint="Opsional. Diawali https://"
              error={formState.errors.verification_url?.message}
            >
              {(a) => <Input {...a} {...register("verification_url")} />}
            </Field>

            <label className="flex items-center gap-2 text-sm text-adm-fg">
              <Checkbox {...register("is_published")} />
              Tampilkan di halaman publik
            </label>

            <div className="flex gap-2">
              {/* Tombol simpan ditahan selama unggahan berjalan. */}
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
          Tambah pencapaian
        </Button>
      )}

      <ItemList
        tabel="achievements"
        items={items.map((i) => ({
          id: i.id,
          judul: i.title,
          keterangan: [i.issuer, i.issued_date ? formatTanggal(i.issued_date) : null]
            .filter(Boolean)
            .join(" · "),
          is_published: i.is_published,
          penanda: <Badge>{labelAchievementCategory(i.category)}</Badge>,
        }))}
        onSunting={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) buka(item);
        }}
        labelHapus={(item) =>
          `"${item.judul}" akan dihapus permanen beserta berkas gambarnya di Storage, dan langsung hilang dari halaman Pencapaian.`
        }
        emptyTitle="Belum ada pencapaian"
        emptyDescription="Tambahkan sertifikat atau penghargaan agar grid di halaman Pencapaian terisi."
        emptyAction={<Button onClick={() => buka()}>Tambah pencapaian</Button>}
      />
    </div>
  );
}
