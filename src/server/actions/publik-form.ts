"use server";

import { PublicActionError, withPublicAction } from "@/server/actions/public";
import { contactMessageSchema, visitorRatingSchema } from "@/shared/schemas";
import { createServerSupabaseClient } from "@/server/db/client";

/**
 * Aksi tulis dari pengunjung.
 *
 * Keduanya memakai klien Supabase dengan kunci anon — sama seperti peramban —
 * sehingga RLS adalah satu-satunya penjaga, dan kebijakan yang salah muncul
 * saat pengembangan, bukan setelah produksi.
 */

export const kirimPesanAction = withPublicAction(
  contactMessageSchema,
  async (input) => {
    const supabase = createServerSupabaseClient();

    // is_read dan is_published sengaja TIDAK dikirim: nilainya ditentukan
    // database, dan policy RLS menolak kalau pengunjung mencoba mengaturnya.
    const { error } = await supabase.from("messages").insert({
      sender_name: input.sender_name,
      sender_email: input.sender_email,
      subject: input.subject,
      body: input.body,
    });

    if (error) {
      console.error("[kirimPesan] gagal menyimpan:", error.message);
      throw new PublicActionError(
        "Pesan gagal dikirim. Coba lagi beberapa saat.",
      );
    }
  },
  {
    jenis: "contact",
    sukses: "Pesan Anda terkirim. Terima kasih sudah menghubungi saya!",
  },
);

export const kirimRatingAction = withPublicAction(
  visitorRatingSchema,
  async (input) => {
    const supabase = createServerSupabaseClient();

    // is_approved tidak dikirim: rating masuk sebagai menunggu persetujuan,
    // dan policy RLS menolak kalau pengunjung mencoba menyetujuinya sendiri.
    const { error } = await supabase.from("ratings").insert({
      reviewer_name: input.reviewer_name,
      stars: input.stars,
      comment: input.comment,
    });

    if (error) {
      console.error("[kirimRating] gagal menyimpan:", error.message);
      throw new PublicActionError(
        "Rating gagal dikirim. Coba lagi beberapa saat.",
      );
    }
  },
  {
    jenis: "rating",
    sukses:
      "Terima kasih! Penilaian Anda akan tampil setelah saya tinjau terlebih dahulu.",
  },
);
