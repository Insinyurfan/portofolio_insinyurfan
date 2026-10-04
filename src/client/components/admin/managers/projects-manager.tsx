"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { ItemList } from "@/client/components/admin/item-list";
import { StringListField } from "@/client/components/admin/managers/string-list-field";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanProyekAction, unggahAction } from "@/server/actions/konten";
import { toastGagal } from "@/client/components/admin/toaster";
import { keSlug, projectSchema } from "@/shared/schemas";
import type { Project } from "@/shared/types";

type Nilai = z.input<typeof projectSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof projectSchema>;

const KOSONG: Nilai = {
  id: null,
  title: "",
  slug: "",
  summary: "",
  description: "",
  tech_stack: [],
  gallery: [],
  thumbnail_url: "",
  demo_url: "",
  repo_url: "",
  featured: false,
  sort_order: 0,
  is_published: true,
};

export function ProjectsManager({ items }: { items: Project[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [terbuka, setTerbuka] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(projectSchema),
    defaultValues: KOSONG,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    control,
    formState,
  } = form;

  function buka(item?: Project) {
    reset(
      item
        ? {
            id: item.id,
            title: item.title,
            slug: item.slug,
            summary: item.summary ?? "",
            description: item.description ?? "",
            tech_stack: item.tech_stack,
            gallery: item.gallery,
            thumbnail_url: item.thumbnail_url ?? "",
            demo_url: item.demo_url ?? "",
            repo_url: item.repo_url ?? "",
            featured: item.featured,
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

    const ok = await jalankan(() => simpanProyekAction(nilai), {
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

  /** Unggah beberapa gambar galeri sekaligus. */
  async function tambahGaleri(files: FileList) {
    setMengunggah(true);
    const urlBaru: string[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefiks", "projects");
      fd.set("jenis", "gambar");
      const hasil = await unggahAction(fd);
      if (hasil.ok && hasil.data) urlBaru.push(hasil.data.url);
      else if (!hasil.ok) toastGagal(hasil.message);
    }

    if (urlBaru.length > 0) {
      setValue("gallery", [...(getValues("gallery") ?? []), ...urlBaru]);
    }
    setMengunggah(false);
  }

  return (
    <div className="space-y-4">
      {terbuka ? (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-adm-fg">
              {getValues("id") ? "Sunting proyek" : "Proyek baru"}
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
              {(a) => (
                <Input
                  {...a}
                  {...register("title", {
                    onChange: (e) => {
                      // Slug diusulkan dari judul hanya untuk proyek BARU,
                      // supaya slug proyek yang sudah terbit tidak berubah
                      // diam-diam saat judulnya disunting.
                      if (!getValues("id")) {
                        setValue("slug", keSlug(e.target.value));
                      }
                    },
                  })}
                />
              )}
            </Field>

            <Field
              id="slug"
              label="Slug"
              required
              hint="Bagian alamat halaman: /proyek/<slug>. Huruf kecil, angka, dan tanda hubung."
              error={formState.errors.slug?.message}
            >
              {(a) => <Input {...a} {...register("slug")} />}
            </Field>

            <Field
              id="summary"
              label="Ringkasan"
              hint="Satu-dua kalimat. Tampil di kartu proyek dan sebagai deskripsi SEO."
              error={formState.errors.summary?.message}
            >
              {(a) => <Textarea {...a} {...register("summary")} className="min-h-20" />}
            </Field>

            <Field
              id="description"
              label="Deskripsi lengkap"
              hint="Pisahkan paragraf dengan satu baris kosong."
              error={formState.errors.description?.message}
            >
              {(a) => (
                <Textarea {...a} {...register("description")} className="min-h-40" />
              )}
            </Field>

            <Controller
              control={control}
              name="tech_stack"
              render={({ field }) => (
                <StringListField
                  label="Tech stack"
                  nilai={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Next.js"
                  hint="Nilai ini juga menjadi pilihan filter di halaman Proyek. Duplikat dibuang otomatis."
                />
              )}
            />

            <Controller
              control={control}
              name="thumbnail_url"
              render={({ field }) => (
                <FileField
                  label="Thumbnail"
                  nilai={field.value ?? null}
                  prefiks="projects"
                  hint="Rasio 16:10 paling pas. Maksimal 5 MB."
                  onChange={(url) => field.onChange(url ?? "")}
                  onSedangMengunggah={setMengunggah}
                />
              )}
            />

            <Controller
              control={control}
              name="gallery"
              render={({ field }) => (
                <div className="space-y-2">
                  <StringListField
                    label="Galeri gambar"
                    nilai={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="https://…"
                    hint="Urutan di sini adalah urutan yang tampil di halaman detail."
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-adm-primary">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          void tambahGaleri(e.target.files);
                          e.target.value = "";
                        }
                      }}
                    />
                    <span className="underline-offset-2 hover:underline">
                      {mengunggah ? "Mengunggah…" : "Atau unggah gambar galeri →"}
                    </span>
                  </label>
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="demo_url"
                label="Tautan demo"
                error={formState.errors.demo_url?.message}
              >
                {(a) => <Input {...a} {...register("demo_url")} />}
              </Field>
              <Field
                id="repo_url"
                label="Tautan repositori"
                error={formState.errors.repo_url?.message}
              >
                {(a) => <Input {...a} {...register("repo_url")} />}
              </Field>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-adm-fg">
                <Checkbox {...register("featured")} />
                Tampilkan di cuplikan beranda (featured)
              </label>
              <label className="flex items-center gap-2 text-sm text-adm-fg">
                <Checkbox {...register("is_published")} />
                Tampilkan di halaman publik
              </label>
            </div>

            <div className="flex gap-2">
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
          Tambah proyek
        </Button>
      )}

      <ItemList
        tabel="projects"
        items={items.map((p) => ({
          id: p.id,
          judul: p.title,
          keterangan: `/proyek/${p.slug}${
            p.tech_stack.length > 0 ? ` — ${p.tech_stack.join(", ")}` : ""
          }`,
          is_published: p.is_published,
          penanda: p.featured ? <Badge tone="success">Featured</Badge> : undefined,
        }))}
        onSunting={(id) => {
          const item = items.find((p) => p.id === id);
          if (item) buka(item);
        }}
        labelHapus={(item) =>
          `"${item.judul}" akan dihapus permanen beserta thumbnail dan seluruh gambar galerinya di Storage. Halaman detailnya langsung hilang dan ikut dikeluarkan dari sitemap.`
        }
        emptyTitle="Belum ada proyek"
        emptyDescription="Proyek adalah bagian paling penting dari portofolio. Tambahkan yang pertama."
        emptyAction={<Button onClick={() => buka()}>Tambah proyek</Button>}
      />
    </div>
  );
}
