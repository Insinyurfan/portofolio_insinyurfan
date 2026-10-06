"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { FileField } from "@/client/components/admin/file-field";
import { GalleryField } from "@/client/components/admin/gallery-field";
import { StringListField } from "@/client/components/admin/managers/string-list-field";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  Textarea,
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanProfilAction } from "@/server/actions/konten";
import { profileSchema } from "@/shared/schemas";
import type { Profile } from "@/shared/types";

type Nilai = z.input<typeof profileSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof profileSchema>;

/**
 * Editor profil — satu baris, bukan daftar.
 *
 * Kalau baris profil belum ada, aksi simpan yang membuatnya. Menyimpan
 * berulang kali tidak pernah membuat baris kedua: aksi selalu mencari baris
 * yang ada lebih dulu, dan database pun menolaknya lewat constraint singleton.
 */
export function ProfileManager({ profile }: { profile: Profile | null }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [mengunggah, setMengunggah] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      username: profile?.username ?? "",
      roles: profile?.roles ?? [],
      tagline: profile?.tagline ?? "",
      bio: profile?.bio ?? "",
      location: profile?.location ?? "",
      email: profile?.email ?? "",
      is_open_to_work: profile?.is_open_to_work ?? false,
      site_name: profile?.site_name ?? "",
      logo_url: profile?.logo_url ?? "",
      photo_url: profile?.photo_url ?? "",
      photos: profile?.photos ?? [],
      cv_url: profile?.cv_url ?? "",
      is_published: profile?.is_published ?? true,
    },
  });
  const { register, handleSubmit, setError, control, formState, getValues } = form;

  return (
    <Panel>
      <form
        onSubmit={handleSubmit(async () => {
          const nilai = getValues();
          await jalankan(() => simpanProfilAction(nilai), {
            onFieldError: (f) => {
              for (const [k, p] of Object.entries(f))
                setError(k as keyof Nilai, { message: p });
            },
          });
        })}
        noValidate
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="full_name"
            label="Nama lengkap"
            required
            error={formState.errors.full_name?.message}
          >
            {(a) => <Input {...a} {...register("full_name")} />}
          </Field>
          <Field
            id="username"
            label="Username"
            required
            error={formState.errors.username?.message}
          >
            {(a) => <Input {...a} {...register("username")} />}
          </Field>
        </div>

        <Field
          id="site_name"
          label="Nama situs"
          hint="Tampil di pojok kiri header dan di judul tab peramban. Dikosongkan berarti memakai “Portofolio”. Maksimal 40 karakter."
          error={formState.errors.site_name?.message}
        >
          {(a) => <Input {...a} {...register("site_name")} />}
        </Field>

        <Controller
          control={control}
          name="logo_url"
          render={({ field }) => (
            <FileField
              label="Logo header"
              nilai={field.value ?? null}
              prefiks="logo"
              hint="Tampil di samping nama situs. Rasio apa pun boleh — gambar disesuaikan tanpa terpotong. Dikosongkan berarti header hanya menampilkan nama. Logo lama otomatis dihapus setelah penggantian tersimpan."
              onChange={(url) => field.onChange(url ?? "")}
              onSedangMengunggah={setMengunggah}
            />
          )}
        />

        <Field
          id="tagline"
          label="Tagline"
          hint="Satu kalimat singkat di bawah nama pada beranda."
          error={formState.errors.tagline?.message}
        >
          {(a) => <Input {...a} {...register("tagline")} />}
        </Field>

        <Controller
          control={control}
          name="roles"
          render={({ field }) => (
            <StringListField
              label="Daftar role"
              nilai={field.value ?? []}
              onChange={field.onChange}
              placeholder="Pengembang Web"
              hint="Tampil bergantian dengan animasi ketik di beranda, mengikuti urutan ini. Baris kosong dibuang otomatis."
            />
          )}
        />

        <Field
          id="bio"
          label="Bio — Tentang Saya"
          hint="Pisahkan paragraf dengan satu baris kosong."
          error={formState.errors.bio?.message}
        >
          {(a) => <Textarea {...a} {...register("bio")} className="min-h-40" />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="location"
            label="Lokasi"
            error={formState.errors.location?.message}
          >
            {(a) => <Input {...a} {...register("location")} />}
          </Field>
          <Field id="email" label="Email" error={formState.errors.email?.message}>
            {(a) => <Input {...a} {...register("email")} type="email" />}
          </Field>
        </div>

        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <GalleryField
              label="Foto profil"
              nilai={field.value ?? []}
              prefiks="profile"
              onChange={field.onChange}
              onSedangMengunggah={setMengunggah}
              hint="Boleh lebih dari satu — hero beranda menampilkannya sebagai galeri yang dapat digeser. Foto PERTAMA menjadi foto utama, yang dipakai di halaman Tentang."
            />
          )}
        />

        <Controller
          control={control}
          name="cv_url"
          render={({ field }) => (
            <FileField
              label="Berkas CV"
              nilai={field.value ?? null}
              prefiks="cv"
              jenis="pdf"
              hint="Hanya PDF, maksimal 10 MB. Tombol Unduh CV di beranda mengarah ke berkas ini."
              onChange={(url) => field.onChange(url ?? "")}
              onSedangMengunggah={setMengunggah}
            />
          )}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-adm-fg">
            <Checkbox {...register("is_open_to_work")} />
            Sedang terbuka untuk pekerjaan
          </label>
          <label className="flex items-center gap-2 text-sm text-adm-fg">
            <Checkbox {...register("is_published")} />
            Tampilkan profil di halaman publik
          </label>
        </div>

        <Button type="submit" disabled={sedangBerjalan || mengunggah}>
          {sedangBerjalan ? "Menyimpan…" : "Simpan profil"}
        </Button>
      </form>
    </Panel>
  );
}
