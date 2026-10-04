"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { kirimRatingAction } from "@/server/actions/publik-form";
import {
  HoneypotField,
  nilaiHoneypot,
} from "@/client/components/public/honeypot-field";
import { HONEYPOT_FIELD } from "@/shared/honeypot";
import { visitorRatingSchema } from "@/shared/schemas";
import { cn } from "@/shared/cn";
import {
  tandaiSudahMemberiRating,
  useSudahMemberiRating,
} from "@/client/hooks/use-rating-submitted";

type Nilai = z.input<typeof visitorRatingSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof visitorRatingSchema>;

/**
 * Form rating pengunjung.
 *
 * Penanda "sudah mengirim" disimpan di peramban dan dibaca HANYA setelah
 * hidrasi. Itu bukan detail kecil: beranda di-cache ISR, jadi kalau keadaan
 * ini ikut dirender di server, halaman yang di-cache akan menampilkan ucapan
 * terima kasih kepada SEMUA pengunjung dan form ratingnya hilang.
 *
 * Penanda ini kenyamanan, bukan pembatas akses — ia hanya mencegah pengiriman
 * ganda yang tidak disengaja. Yang benar-benar menjaga adalah pembatasan laju
 * dan moderasi admin.
 */
export function RatingForm() {
  // false di server dan selama hydration; dibaca dari peramban sesudahnya.
  const sudahKirim = useSudahMemberiRating();
  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const [hasil, setHasil] = useState<
    { tipe: "sukses" | "gagal"; pesan: string } | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(visitorRatingSchema),
    defaultValues: {
      reviewer_name: "",
      stars: 0,
      comment: "",
      nomor_referensi: "",
    },
  });

  // useWatch, bukan watch(): watch() mengembalikan nilai yang tidak dapat
  // dimemoisasi React Compiler dan memicu peringatan kompilasi.
  const bintang = Number(useWatch({ control, name: "stars" }) ?? 0);

  async function kirim() {
    setHasil(null);

    // Honeypot dibaca langsung dari DOM, bukan dari state form.
    const r = await kirimRatingAction({
      ...getValues(),
      [HONEYPOT_FIELD]: nilaiHoneypot(honeypotRef),
    });

    if (r.ok) {
      setHasil({ tipe: "sukses", pesan: r.message });
      reset();
      tandaiSudahMemberiRating();
      return;
    }

    if (r.fieldErrors) {
      for (const [field, pesan] of Object.entries(r.fieldErrors)) {
        setError(field as keyof Nilai, { message: pesan });
      }
    }
    setHasil({ tipe: "gagal", pesan: r.message });
  }

  // Keadaan awal dari server SELALU berupa form. Ucapan terima kasih hanya
  // muncul setelah hidrasi, dan hanya di peramban yang memang sudah mengirim.
  if (sudahKirim) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-raised p-6 text-center">
        <p className="font-heading font-semibold text-text">
          Terima kasih atas penilaian Anda!
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {hasil?.pesan ??
            "Penilaian Anda akan tampil di sini setelah ditinjau."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(() => kirim())(event);
      }}
      noValidate
      className="relative space-y-4 rounded-card border border-border-subtle bg-surface-raised p-5 sm:p-6"
    >
      <HoneypotField inputRef={honeypotRef} />

      <h3 className="font-heading font-semibold text-text">Beri penilaian</h3>

      {/* Pilihan bintang sebagai radio group: dapat dioperasikan keyboard
          dengan tombol panah, dan status terpilihnya diumumkan. */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">
          Bintang
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        </legend>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((nilai) => (
            <label
              key={nilai}
              className="cursor-pointer rounded p-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
            >
              <input
                type="radio"
                value={nilai}
                checked={bintang === nilai}
                onChange={() => setValue("stars", nilai, { shouldValidate: true })}
                name="stars-pilihan"
                className="sr-only"
                aria-describedby={errors.stars ? "stars-error" : undefined}
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-7 transition-colors",
                  bintang >= nilai ? "fill-accent text-accent" : "text-border-strong",
                )}
              />
              <span className="sr-only">{nilai} bintang</span>
            </label>
          ))}
        </div>

        {errors.stars ? (
          <p id="stars-error" className="mt-1.5 text-xs font-semibold text-accent">
            {errors.stars.message}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor="reviewer_name"
          className="block text-sm font-medium text-text"
        >
          Nama
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="reviewer_name"
          {...register("reviewer_name")}
          aria-invalid={errors.reviewer_name ? true : undefined}
          aria-describedby={errors.reviewer_name ? "nama-error" : undefined}
          className="h-11 w-full rounded-card border border-border-strong bg-surface px-3 text-sm text-text"
        />
        {errors.reviewer_name ? (
          <p id="nama-error" className="text-xs font-semibold text-accent">
            {errors.reviewer_name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comment" className="block text-sm font-medium text-text">
          Komentar
        </label>
        <textarea
          id="comment"
          {...register("comment")}
          rows={3}
          aria-invalid={errors.comment ? true : undefined}
          className="w-full rounded-card border border-border-strong bg-surface px-3 py-2 text-sm text-text"
        />
        {errors.comment ? (
          <p className="text-xs font-semibold text-accent">
            {errors.comment.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {isSubmitting ? "Mengirim…" : "Kirim penilaian"}
      </button>

      {hasil && hasil.tipe === "gagal" ? (
        <p
          role="status"
          className="rounded-card border border-border-strong bg-surface-sunken px-4 py-3 text-sm font-medium text-text"
        >
          {hasil.pesan}
        </p>
      ) : null}
    </form>
  );
}
