"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
} from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { useScrollKeForm } from "@/client/components/admin/use-scroll-ke-form";
import { simpanSertifikatAction } from "@/server/actions/konten";
import { achievementSchema } from "@/shared/schemas";
import { formatTanggal } from "@/shared/format";
import { daftarKategori, kategoriSertifikat, logoOtomatisPenerbit, SARAN_KATEGORI_SERTIFIKAT } from "@/shared/sertifikat";
import type { Achievement } from "@/shared/types";

type Nilai = z.input<typeof achievementSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof achievementSchema>;

const KOSONG: Nilai = {
  id: null,
  title: "",
  issuer: "",
  issuer_logo_url: "",
  issued_date: "",
  category: "certificate",
  certificate_category: "",
  image_url: "",
  pdf_url: "",
  verification_url: "",
  sort_order: 0,
  is_published: true,
};

export function AchievementsManager({ items }: { items: Achievement[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const { panel, versiForm, arahkan } = useScrollKeForm();
  const [terbuka, setTerbuka] = useState(false);
  const [mengunggahGambar, setMengunggahGambar] = useState(false);
  const [mengunggahPdf, setMengunggahPdf] = useState(false);
  const [mengunggahLogo, setMengunggahLogo] = useState(false);
  const mengunggah = mengunggahGambar || mengunggahPdf || mengunggahLogo;
  const sibuk = sedangBerjalan || mengunggah;
  const saranKategori = daftarKategori([...SARAN_KATEGORI_SERTIFIKAT, ...items.map(kategoriSertifikat)]);

  const form = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(achievementSchema),
    defaultValues: KOSONG,
  });
  const { register, handleSubmit, reset, setError, formState, getValues, control } =
    form;
  const penerbit = useWatch({ control, name: "issuer" });
  const logoOtomatis = logoOtomatisPenerbit(penerbit);

  function buka(item?: Achievement) {
    reset(
      item
        ? {
            id: item.id,
            title: item.title,
            issuer: item.issuer ?? "",
            issuer_logo_url: item.issuer_logo_url ?? "",
            issued_date: item.issued_date ?? "",
            category: item.category,
            certificate_category: kategoriSertifikat(item),
            image_url: item.image_url ?? "",
            pdf_url: item.pdf_url ?? "",
            verification_url: item.verification_url ?? "",
            sort_order: item.sort_order,
            is_published: item.is_published,
          }
        : { ...KOSONG, sort_order: items.length + 1 },
    );
    setTerbuka(true);
    arahkan();
  }

  async function simpan() {
    if (sibuk) return;
    // Nilai MENTAH form: server yang mem-parse dan mentransformnya.
    const nilai = getValues();

    const ok = await jalankan(() => simpanSertifikatAction(nilai), {
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
        <Panel {...panel}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-adm-fg">
              {getValues("id") ? "Sunting sertifikat" : "Sertifikat baru"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTerbuka(false)}
              disabled={sibuk}
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

            <Controller
              key={versiForm}
              control={control}
              name="issuer_logo_url"
              render={({ field }) => (
                <FileField
                  label="Logo penerbit"
                  nilai={field.value ?? null}
                  prefiks="issuer-logos"
                  disabled={sibuk}
                  pratinjauCadangan={logoOtomatis ? {
                    ...logoOtomatis,
                    keterangan: (
                      <p className="text-xs text-adm-fg-subtle">
                        <span className="font-semibold text-adm-fg">Logo otomatis</span>
                        {" · "}
                        <a
                          href={logoOtomatis.sumber}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-adm-primary underline underline-offset-2"
                        >
                          Lihat sumber
                        </a>
                      </p>
                    ),
                  } : null}
                  hint={formState.errors.issuer_logo_url?.message ?? (
                    field.value
                      ? "Logo unggahan untuk sertifikat ini."
                      : "Jika tersedia, logo otomatis mengikuti nama penerbit. Unggah logo sendiri untuk memilih gambar lain."
                  )}
                  onChange={(url) => field.onChange(url ?? "")}
                  onSedangMengunggah={setMengunggahLogo}
                />
              )}
            />

            <Field
              id="certificate_category"
              label="Kategori"
              hint="Pilih kategori yang sudah ada atau ketik nama kategori baru."
              error={formState.errors.certificate_category?.message}
            >
              {(a) => (
                <Input
                  {...a}
                  {...register("certificate_category")}
                  list="saran-kategori-sertifikat"
                  maxLength={80}
                  placeholder="Misalnya, Kegiatan Kampus"
                />
              )}
            </Field>
            <datalist id="saran-kategori-sertifikat">
              {saranKategori.map((kategori) => <option key={kategori} value={kategori} />)}
            </datalist>

            <fieldset key={versiForm} className="space-y-3 rounded-adm border border-adm-border p-4">
              <legend className="px-1 text-sm font-semibold text-adm-fg">Berkas sertifikat</legend>
              <p className="text-sm text-adm-fg-muted">
                Unggah PDF atau gambar. Jika keduanya ada, gambar dipakai sebagai sampul.
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                <Controller
                  control={control}
                  name="pdf_url"
                  render={({ field }) => (
                    <FileField
                      label="PDF sertifikat"
                      nilai={field.value ?? null}
                      prefiks="achievements"
                      jenis="pdf"
                      unggahLangsung
                      disabled={sedangBerjalan}
                      hint="Maksimal 10 MB."
                      onChange={(url) => field.onChange(url ?? "")}
                      onSedangMengunggah={setMengunggahPdf}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="image_url"
                  render={({ field }) => (
                    <FileField
                      label="Gambar sertifikat"
                      nilai={field.value ?? null}
                      prefiks="achievements"
                      disabled={sedangBerjalan}
                      hint="Maksimal 5 MB setelah optimasi."
                      onChange={(url) => field.onChange(url ?? "")}
                      onSedangMengunggah={setMengunggahGambar}
                    />
                  )}
                />
              </div>
            </fieldset>

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
              <Button type="submit" disabled={sibuk}>
                {sedangBerjalan ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setTerbuka(false)}
                disabled={sibuk}
              >
                Batal
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button onClick={() => buka()}>
          <Plus aria-hidden="true" />
          Tambah sertifikat
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
          penanda: <Badge>{kategoriSertifikat(i)}</Badge>,
        }))}
        suntingDinonaktifkan={sibuk}
        onSunting={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) buka(item);
        }}
        labelHapus={(item) =>
          `"${item.judul}" beserta berkas PDF atau gambarnya akan dihapus permanen dari halaman Sertifikat.`
        }
        emptyTitle="Belum ada sertifikat"
        emptyDescription="Tambahkan sertifikat pertama untuk ditampilkan di halaman publik."
        emptyAction={!terbuka ? <Button onClick={() => buka()}>Tambah sertifikat</Button> : undefined}
      />
    </div>
  );
}
