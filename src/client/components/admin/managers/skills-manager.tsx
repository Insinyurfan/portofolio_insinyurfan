"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { ItemList } from "@/client/components/admin/item-list";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Select,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import {
  simpanKategoriKeahlianAction,
  simpanKeahlianAction,
} from "@/server/actions/konten";
import {
  TINGKAT_KEAHLIAN,
  skillCategorySchema,
  skillSchema,
} from "@/shared/schemas";
import type { Skill, SkillCategory } from "@/shared/types";

type NilaiKategori = z.input<typeof skillCategorySchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type KeluaranKategori = z.output<typeof skillCategorySchema>;
type NilaiKeahlian = z.input<typeof skillSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type KeluaranKeahlian = z.output<typeof skillSchema>;

/**
 * Mempersempit nilai tingkat dari database menjadi nilai yang diterima form.
 *
 * Database sudah membatasinya lewat check constraint, tetapi tipenya tetap
 * `string | null`. Diperiksa sungguhan di sini, bukan dipaksa dengan cast:
 * kalau suatu saat ada nilai di luar ketiganya, form kembali ke "belum
 * dipilih" alih-alih menyimpan nilai yang akan ditolak database.
 */
function tingkatSah(nilai: string | null): "" | (typeof TINGKAT_KEAHLIAN)[number] {
  return TINGKAT_KEAHLIAN.includes(nilai as (typeof TINGKAT_KEAHLIAN)[number])
    ? (nilai as (typeof TINGKAT_KEAHLIAN)[number])
    : "";
}

const KATEGORI_KOSONG: NilaiKategori = {
  id: null,
  name: "",
  icon: "",
  eyebrow: "",
  description: "",
  sort_order: 0,
  is_published: true,
};

const KEAHLIAN_KOSONG: NilaiKeahlian = {
  id: null,
  category_id: "",
  name: "",
  icon: "",
  logo_url: "",
  since_year: "",
  level: "",
  sort_order: 0,
  is_published: true,
};

/**
 * Kategori dan keahlian dikelola dalam satu alur.
 *
 * Keahlian selalu dibuat di bawah sebuah kategori — field kategori induk
 * wajib diisi, dan daftar pilihannya diambil dari kategori yang ada.
 */
export function SkillsManager({
  categories,
  skills,
}: {
  categories: SkillCategory[];
  skills: Skill[];
}) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [formKategori, setFormKategori] = useState(false);
  const [formKeahlian, setFormKeahlian] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const fk = useForm<NilaiKategori, unknown, KeluaranKategori>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: KATEGORI_KOSONG,
  });

  const fs = useForm<NilaiKeahlian, unknown, KeluaranKeahlian>({
    resolver: zodResolver(skillSchema),
    defaultValues: KEAHLIAN_KOSONG,
  });

  function bukaKategori(item?: SkillCategory) {
    fk.reset(
      item
        ? {
            id: item.id,
            name: item.name,
            icon: item.icon ?? "",
            eyebrow: item.eyebrow ?? "",
            description: item.description ?? "",
            sort_order: item.sort_order,
            is_published: item.is_published,
          }
        : { ...KATEGORI_KOSONG, sort_order: categories.length + 1 },
    );
    setFormKategori(true);
    setFormKeahlian(false);
  }

  function bukaKeahlian(item?: Skill) {
    fs.reset(
      item
        ? {
            id: item.id,
            category_id: item.category_id,
            name: item.name,
            icon: item.icon ?? "",
            logo_url: item.logo_url ?? "",
            since_year: item.since_year ?? "",
            level: tingkatSah(item.level),
            sort_order: item.sort_order,
            is_published: item.is_published,
          }
        : {
            ...KEAHLIAN_KOSONG,
            category_id: categories[0]?.id ?? "",
            sort_order: skills.length + 1,
          },
    );
    setFormKeahlian(true);
    setFormKategori(false);
  }

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------ Kategori */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-adm-fg">Kategori</h2>

        {formKategori ? (
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-adm-fg">
                {fk.getValues("id") ? "Sunting kategori" : "Kategori baru"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFormKategori(false)}
                aria-label="Tutup form"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <form
              onSubmit={fk.handleSubmit(async () => {
                const nilai = fk.getValues();
                const ok = await jalankan(() => simpanKategoriKeahlianAction(nilai), {
                  onFieldError: (f) => {
                    for (const [k, p] of Object.entries(f))
                      fk.setError(k as keyof NilaiKategori, { message: p });
                  },
                });
                if (ok) {
                  setFormKategori(false);
                  fk.reset(KATEGORI_KOSONG);
                }
              })}
              noValidate
              className="space-y-4"
            >
              <Field
                id="kategori-name"
                label="Nama kategori"
                required
                error={fk.formState.errors.name?.message}
              >
                {(a) => (
                  <Input
                    {...a}
                    {...fk.register("name")}
                    placeholder="Bahasa Pemrograman"
                  />
                )}
              </Field>

              <Field
                id="kategori-eyebrow"
                label="Label kecil"
                hint="Tampil di atas nama kategori dengan huruf kapital. Misalnya: Creative toolkit."
                error={fk.formState.errors.eyebrow?.message}
              >
                {(a) => (
                  <Input {...a} {...fk.register("eyebrow")} placeholder="Creative toolkit" />
                )}
              </Field>

              <Field
                id="kategori-description"
                label="Deskripsi kategori"
                hint="Satu paragraf pengantar, tampil di samping judul kategori."
                error={fk.formState.errors.description?.message}
              >
                {(a) => <Textarea {...a} {...fk.register("description")} rows={3} />}
              </Field>

              <label className="flex items-center gap-2 text-sm text-adm-fg">
                <Checkbox {...fk.register("is_published")} />
                Tampilkan di halaman publik
              </label>

              <div className="flex gap-2">
                <Button type="submit" disabled={sedangBerjalan}>
                  {sedangBerjalan ? "Menyimpan…" : "Simpan"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFormKategori(false)}
                  disabled={sedangBerjalan}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Panel>
        ) : (
          <Button onClick={() => bukaKategori()}>
            <Plus aria-hidden="true" />
            Tambah kategori
          </Button>
        )}

        <ItemList
          tabel="skill_categories"
          items={categories.map((c) => {
            const jumlah = skills.filter((s) => s.category_id === c.id).length;
            return {
              id: c.id,
              judul: c.name,
              keterangan: `${jumlah} keahlian di dalamnya`,
              is_published: c.is_published,
            };
          })}
          onSunting={(id) => {
            const item = categories.find((c) => c.id === id);
            if (item) bukaKategori(item);
          }}
          labelHapus={(item) => {
            const jumlah = skills.filter(
              (s) => s.category_id === item.id,
            ).length;
            return jumlah > 0
              ? `Kategori "${item.judul}" akan dihapus BESERTA ${jumlah} keahlian di dalamnya. Semuanya langsung hilang dari halaman Keahlian. Tindakan ini tidak dapat dibatalkan.`
              : `Kategori "${item.judul}" akan dihapus permanen.`;
          }}
          emptyTitle="Belum ada kategori keahlian"
          emptyDescription="Buat kategori dulu, misalnya “Bahasa Pemrograman”, baru tambahkan keahlian di dalamnya."
          emptyAction={<Button onClick={() => bukaKategori()}>Tambah kategori</Button>}
        />
      </section>

      {/* ------------------------------------------------------ Keahlian */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-adm-fg">Keahlian</h2>

        {categories.length === 0 ? (
          <p className="text-sm text-adm-fg-muted">
            Buat minimal satu kategori dulu — setiap keahlian harus berada di
            bawah sebuah kategori.
          </p>
        ) : formKeahlian ? (
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-adm-fg">
                {fs.getValues("id") ? "Sunting keahlian" : "Keahlian baru"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFormKeahlian(false)}
                aria-label="Tutup form"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <form
              onSubmit={fs.handleSubmit(async () => {
                const nilai = fs.getValues();
                const ok = await jalankan(() => simpanKeahlianAction(nilai), {
                  onFieldError: (f) => {
                    for (const [k, p] of Object.entries(f))
                      fs.setError(k as keyof NilaiKeahlian, { message: p });
                  },
                });
                if (ok) {
                  setFormKeahlian(false);
                  fs.reset(KEAHLIAN_KOSONG);
                }
              })}
              noValidate
              className="space-y-4"
            >
              <Field
                id="skill-category"
                label="Kategori induk"
                required
                hint="Memindahkan keahlian ke kategori lain cukup dengan mengganti pilihan ini."
                error={fs.formState.errors.category_id?.message}
              >
                {(a) => (
                  <Select {...a} {...fs.register("category_id")}>
                    <option value="">— pilih kategori —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="skill-name"
                label="Nama keahlian"
                required
                error={fs.formState.errors.name?.message}
              >
                {(a) => (
                  <Input {...a} {...fs.register("name")} placeholder="TypeScript" />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="skill-since"
                  label="Sejak tahun"
                  hint="Tampil sebagai “Sejak 2023”. Dikosongkan berarti tidak dirender."
                  error={fs.formState.errors.since_year?.message}
                >
                  {(a) => (
                    <Input
                      {...a}
                      {...fs.register("since_year")}
                      type="number"
                      min={1970}
                      max={2100}
                      placeholder="2023"
                    />
                  )}
                </Field>

                <Field
                  id="skill-level"
                  label="Tingkat"
                  error={fs.formState.errors.level?.message}
                >
                  {(a) => (
                    <Select {...a} {...fs.register("level")}>
                      <option value="">— belum dipilih —</option>
                      {TINGKAT_KEAHLIAN.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <Controller
                control={fs.control}
                name="logo_url"
                render={({ field }) => (
                  <FileField
                    label="Logo keahlian"
                    nilai={field.value ?? null}
                    prefiks="skills"
                    hint="Logo alat atau bahasanya. Dikosongkan berarti kartu memakai inisial namanya."
                    onChange={(url) => field.onChange(url ?? "")}
                    onSedangMengunggah={setMengunggah}
                  />
                )}
              />

              <label className="flex items-center gap-2 text-sm text-adm-fg">
                <Checkbox {...fs.register("is_published")} />
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
                  onClick={() => setFormKeahlian(false)}
                  disabled={sedangBerjalan}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Panel>
        ) : (
          <Button onClick={() => bukaKeahlian()}>
            <Plus aria-hidden="true" />
            Tambah keahlian
          </Button>
        )}

        <ItemList
          tabel="skills"
          items={skills.map((s) => ({
            id: s.id,
            judul: s.name,
            keterangan:
              categories.find((c) => c.id === s.category_id)?.name ??
              "Kategori tidak ditemukan",
            is_published: s.is_published,
          }))}
          onSunting={(id) => {
            const item = skills.find((s) => s.id === id);
            if (item) bukaKeahlian(item);
          }}
          emptyTitle="Belum ada keahlian"
          emptyDescription="Tambahkan keahlian ke salah satu kategori di atas."
          emptyAction={
            categories.length > 0 ? (
              <Button onClick={() => bukaKeahlian()}>Tambah keahlian</Button>
            ) : undefined
          }
        />
      </section>
    </div>
  );
}
