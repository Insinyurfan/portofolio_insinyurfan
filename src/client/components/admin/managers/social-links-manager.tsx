"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ItemList } from "@/client/components/admin/item-list";
import { Button, Checkbox, Field, Input, Panel } from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { simpanTautanSosialAction } from "@/server/actions/konten";
import { socialLinkSchema } from "@/shared/schemas";
import type { SocialLink } from "@/shared/types";

type Nilai = z.input<typeof socialLinkSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof socialLinkSchema>;

const KOSONG: Nilai = {
  id: null,
  platform: "",
  url: "",
  sort_order: 0,
  is_published: true,
};

export function SocialLinksManager({ items }: { items: SocialLink[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [formTerbuka, setFormTerbuka] = useState(false);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: KOSONG,
  });
  const { register, handleSubmit, reset, setError, formState, getValues } = form;

  function buka(item?: SocialLink) {
    reset(
      item
        ? {
            id: item.id,
            platform: item.platform,
            url: item.url,
            sort_order: item.sort_order,
            is_published: item.is_published,
          }
        : { ...KOSONG, sort_order: items.length + 1 },
    );
    setFormTerbuka(true);
  }

  async function simpan() {
    // Nilai MENTAH form: server yang mem-parse dan mentransformnya.
    const nilai = getValues();

    const berhasil = await jalankan(() => simpanTautanSosialAction(nilai), {
      onFieldError: (fields) => {
        for (const [key, pesan] of Object.entries(fields)) {
          setError(key as keyof Nilai, { message: pesan });
        }
      },
    });
    if (berhasil) {
      setFormTerbuka(false);
      reset(KOSONG);
    }
  }

  return (
    <div className="space-y-4">
      {formTerbuka ? (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-adm-fg">
              {form.getValues("id") ? "Sunting tautan" : "Tautan baru"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormTerbuka(false)}
              aria-label="Tutup form"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(() => simpan())} noValidate className="space-y-4">
            <Field
              id="platform"
              label="Platform"
              required
              hint="Misalnya: github, linkedin, instagram. Nama ini menentukan ikon yang tampil."
              error={formState.errors.platform?.message}
            >
              {(aria) => (
                <Input {...aria} {...register("platform")} placeholder="github" />
              )}
            </Field>

            <Field
              id="url"
              label="URL"
              required
              hint="Diawali https:// — atau mailto: untuk email."
              error={formState.errors.url?.message}
            >
              {(aria) => (
                <Input
                  {...aria}
                  {...register("url")}
                  placeholder="https://github.com/namaanda"
                />
              )}
            </Field>

            <label className="flex items-center gap-2 text-sm text-adm-fg">
              <Checkbox {...register("is_published")} />
              Tampilkan di halaman publik
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={sedangBerjalan}>
                {sedangBerjalan ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFormTerbuka(false)}
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
          Tambah tautan sosial
        </Button>
      )}

      <ItemList
        tabel="social_links"
        items={items.map((item) => ({
          id: item.id,
          judul: item.platform,
          keterangan: item.url,
          is_published: item.is_published,
        }))}
        onSunting={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) buka(item);
        }}
        emptyTitle="Belum ada tautan sosial"
        emptyDescription="Tambahkan tautan pertama agar ikon media sosial tampil di beranda dan footer."
        emptyAction={<Button onClick={() => buka()}>Tambah tautan sosial</Button>}
      />
    </div>
  );
}
