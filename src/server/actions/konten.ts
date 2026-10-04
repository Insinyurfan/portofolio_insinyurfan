"use server";

import { AksiError, withAdminAction, type HasilAksi } from "@/server/actions/admin";
import type { Entitas } from "@/server/actions/revalidate";
import type { Database } from "@/shared/database.types";
import { requireAdmin, AuthError } from "@/server/auth";
import {
  adalahPrefiksMedia,
  ambilFile,
  hapusBerkas,
  unggahBerkas,
} from "@/server/actions/storage";
import {
  achievementSchema,
  educationSchema,
  experienceSchema,
  hapusSchema,
  profileSchema,
  projectSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
  tandaiPesanSchema,
  moderasiRatingSchema,
  pageIntroSchema,
  toggleTerbitSchema,
  urutkanSchema,
} from "@/shared/schemas";
import { createSessionSupabaseClient } from "@/server/db/session";

/**
 * Seluruh aksi tulis dashboard.
 *
 * Setiap aksi melewati `withAdminAction`, yang menjalankan otorisasi, validasi,
 * handler, lalu revalidasi — dalam urutan itu. Tidak ada aksi yang boleh
 * memanggil database langsung tanpa pembungkus ini.
 */

const KODE_UNIK = "23505";
const KODE_FK = "23503";

/** Menerjemahkan error Postgres menjadi pesan yang bisa ditindaklanjuti admin. */
function terjemahkanError(
  error: { code?: string; message: string },
  konteks: { slug?: boolean } = {},
): never {
  if (error.code === KODE_UNIK) {
    if (konteks.slug || error.message.includes("slug")) {
      throw new AksiError(
        "Slug ini sudah dipakai proyek lain. Pilih slug yang berbeda.",
        "konflik",
        { slug: "Slug sudah dipakai proyek lain." },
      );
    }
    throw new AksiError("Data serupa sudah ada.", "konflik");
  }

  if (error.code === KODE_FK) {
    throw new AksiError(
      "Data ini masih terhubung dengan data lain, jadi tidak bisa disimpan.",
      "konflik",
    );
  }

  console.error("[actions-content] error database:", error.code, error.message);
  throw new AksiError("Gagal menyimpan ke database. Coba lagi.", "server");
}

/** Nama tabel yang benar-benar ada di skema, menurut tipe hasil generate. */
type NamaTabel = keyof Database["public"]["Tables"];

/**
 * Upsert generik: ada id → update, tidak ada → insert.
 *
 * Payload di-cast ke `never` saat diserahkan ke klien Supabase: tipe generik
 * klien itu menuntut bentuk payload yang persis sesuai satu tabel tertentu,
 * sementara helper ini memang sengaja dipakai lintas tabel. Keamanan bentuk
 * payload dijamin lebih dulu oleh skema zod di `withAdminAction`, yang sudah
 * mem-parse input sebelum sampai ke sini.
 */
async function simpanBaris(
  tabel: NamaTabel,
  nilai: Record<string, unknown> & { id?: string | null },
  opsi: { slug?: boolean } = {},
): Promise<{ id: string }> {
  const supabase = await createSessionSupabaseClient();
  const { id, ...kolom } = nilai;

  if (id) {
    const { data, error } = await supabase
      .from(tabel)
      .update(kolom as never)
      .eq("id", id)
      .select("id")
      .single();
    if (error) terjemahkanError(error, opsi);
    return data as { id: string };
  }

  const { data, error } = await supabase
    .from(tabel)
    .insert(kolom as never)
    .select("id")
    .single();
  if (error) terjemahkanError(error, opsi);
  return data as { id: string };
}

async function ambilBaris(tabel: NamaTabel, id: string) {
  const supabase = await createSessionSupabaseClient();
  const { data } = await supabase.from(tabel).select("*").eq("id", id).maybeSingle();
  return data as Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Unggahan berkas
// ---------------------------------------------------------------------------

/**
 * Mengunggah satu berkas dan mengembalikan URL publiknya.
 *
 * Terpisah dari aksi simpan supaya pratinjau bisa tampil sebelum form
 * disimpan. Berkas lama dihapus di aksi simpan, SETELAH baris database yang
 * menunjuk berkas baru berhasil tersimpan.
 */
export async function unggahAction(
  formData: FormData,
): Promise<HasilAksi<{ url: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: error.alasan === "tanpa-sesi" ? "sesi-berakhir" : "bukan-admin",
        message: error.message,
      };
    }
    throw error;
  }

  const file = ambilFile(formData, "file");
  if (!file) {
    return { ok: false, code: "validasi", message: "Tidak ada berkas yang dipilih." };
  }

  // Nilainya datang dari form dan bisa berisi apa saja, jadi diperiksa lewat
  // penjaga tipe yang diturunkan dari daftar yang sama dengan tipenya — bukan
  // daftar kedua yang ditulis ulang di sini dan bisa tertinggal saat tujuan
  // unggahan baru ditambahkan.
  const prefiksMentah = String(formData.get("prefiks") ?? "");
  const jenis = formData.get("jenis") === "pdf" ? "pdf" : "gambar";

  if (!adalahPrefiksMedia(prefiksMentah)) {
    return { ok: false, code: "validasi", message: "Tujuan unggahan tidak dikenali." };
  }
  const prefiks = prefiksMentah;

  try {
    const url = await unggahBerkas(file, prefiks, jenis);
    return { ok: true, message: "Berkas terunggah.", data: { url } };
  } catch (error) {
    if (error instanceof AksiError) {
      return { ok: false, code: error.code, message: error.message };
    }
    console.error("[unggahAction]", error);
    return { ok: false, code: "server", message: "Berkas gagal diunggah." };
  }
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

export const simpanProfilAction = withAdminAction(
  profileSchema,
  async (input) => {
    const supabase = await createSessionSupabaseClient();
    const { data: lama } = await supabase
      .from("profile")
      .select("id, photo_url, cv_url, logo_url")
      .limit(1)
      .maybeSingle();

    const hasil = await simpanBaris("profile", { ...input, id: lama?.id ?? null });

    // Berkas lama dihapus hanya setelah baris baru tersimpan.
    if (lama) {
      if (lama.photo_url && lama.photo_url !== input.photo_url) {
        await hapusBerkas(lama.photo_url);
      }
      if (lama.cv_url && lama.cv_url !== input.cv_url) {
        await hapusBerkas(lama.cv_url);
      }
      if (lama.logo_url && lama.logo_url !== input.logo_url) {
        await hapusBerkas(lama.logo_url);
      }
    }

    return hasil;
  },
  { sukses: "Profil tersimpan.", revalidasi: "profile" },
);

// ---------------------------------------------------------------------------
// Tautan sosial, pendidikan, keahlian, pengalaman, pencapaian
// ---------------------------------------------------------------------------

export const simpanTautanSosialAction = withAdminAction(
  socialLinkSchema,
  (input) => simpanBaris("social_links", input),
  {
    sukses: (i) => (i.id ? "Tautan sosial diperbarui." : "Tautan sosial ditambahkan."),
    revalidasi: "social_links",
  },
);

export const simpanPendidikanAction = withAdminAction(
  educationSchema,
  async (input) => {
    const lama = input.id ? await ambilBaris("education", input.id) : null;
    const hasil = await simpanBaris("education", input);
    await bersihkanBerkasLama(lama, input);
    return hasil;
  },
  {
    sukses: (i) => (i.id ? "Pendidikan diperbarui." : "Pendidikan ditambahkan."),
    revalidasi: "education",
  },
);

/**
 * Membersihkan berkas yang TIDAK lagi dirujuk baris setelah disimpan.
 *
 * Dipanggil SESUDAH penyimpanan berhasil, bukan sebelumnya: kalau
 * penyimpanannya gagal, berkas yang masih dipakai tidak boleh ikut hilang.
 */
async function bersihkanBerkasLama(
  lama: Record<string, unknown> | null,
  baru: { logo_url?: string | null; gallery?: string[] },
): Promise<void> {
  if (!lama) return;

  const buang: string[] = [];

  const logoLama = lama.logo_url;
  if (typeof logoLama === "string" && logoLama !== baru.logo_url) {
    buang.push(logoLama);
  }

  const galeriLama = Array.isArray(lama.gallery) ? (lama.gallery as string[]) : [];
  const galeriBaru = baru.gallery ?? [];
  buang.push(...galeriLama.filter((g) => !galeriBaru.includes(g)));

  if (buang.length > 0) await hapusBerkas(...buang);
}

export const simpanKategoriKeahlianAction = withAdminAction(
  skillCategorySchema,
  (input) => simpanBaris("skill_categories", input),
  {
    sukses: (i) => (i.id ? "Kategori diperbarui." : "Kategori ditambahkan."),
    revalidasi: "skill_categories",
  },
);

export const simpanKeahlianAction = withAdminAction(
  skillSchema,
  (input) => simpanBaris("skills", input),
  {
    sukses: (i) => (i.id ? "Keahlian diperbarui." : "Keahlian ditambahkan."),
    revalidasi: "skills",
  },
);

export const simpanPengalamanAction = withAdminAction(
  experienceSchema,
  async (input) => {
    const lama = input.id ? await ambilBaris("experiences", input.id) : null;
    const hasil = await simpanBaris("experiences", input);
    await bersihkanBerkasLama(lama, input);
    return hasil;
  },
  {
    sukses: (i) => (i.id ? "Pengalaman diperbarui." : "Pengalaman ditambahkan."),
    revalidasi: "experiences",
  },
);

export const simpanPencapaianAction = withAdminAction(
  achievementSchema,
  async (input) => {
    const lama = input.id ? await ambilBaris("achievements", input.id) : null;
    const hasil = await simpanBaris("achievements", input);

    const gambarLama = lama?.image_url as string | null | undefined;
    if (gambarLama && gambarLama !== input.image_url) {
      await hapusBerkas(gambarLama);
    }

    return hasil;
  },
  {
    sukses: (i) => (i.id ? "Pencapaian diperbarui." : "Pencapaian ditambahkan."),
    revalidasi: "achievements",
  },
);

// ---------------------------------------------------------------------------
// Proyek
// ---------------------------------------------------------------------------

export const simpanProyekAction = withAdminAction(
  projectSchema,
  async (input) => {
    const lama = input.id ? await ambilBaris("projects", input.id) : null;

    const hasil = await simpanBaris("projects", input, { slug: true });

    // Gambar yang tidak lagi dirujuk dibersihkan dari Storage.
    const thumbLama = lama?.thumbnail_url as string | null | undefined;
    if (thumbLama && thumbLama !== input.thumbnail_url) {
      await hapusBerkas(thumbLama);
    }

    const galeriLama = (lama?.gallery as string[] | undefined) ?? [];
    const dibuang = galeriLama.filter((g) => !input.gallery.includes(g));
    if (dibuang.length > 0) await hapusBerkas(...dibuang);

    return { ...hasil, slugLama: (lama?.slug as string | undefined) ?? null };
  },
  {
    sukses: (i) => (i.id ? "Proyek diperbarui." : "Proyek ditambahkan."),
    revalidasi: "projects",
    konteks: (input, data) => ({
      slug: input.slug,
      slugLama: data.slugLama ?? undefined,
      // Beranda ikut direvalidasi kalau proyek ini featured, atau tadinya featured.
      featured: true,
    }),
  },
);

// ---------------------------------------------------------------------------
// Aksi lintas entitas
// ---------------------------------------------------------------------------

// Partial: tidak setiap tabel adalah entitas konten yang perlu direvalidasi.
// rate_limit_attempts, misalnya, tidak pernah tampil di halaman publik.
const ENTITAS_DARI_TABEL: Partial<Record<NamaTabel, Entitas>> = {
  profile: "profile",
  social_links: "social_links",
  education: "education",
  skill_categories: "skill_categories",
  skills: "skills",
  experiences: "experiences",
  projects: "projects",
  achievements: "achievements",
  messages: "messages",
  ratings: "ratings",
  page_intros: "page_intros",
};

export const toggleTerbitAction = withAdminAction(
  toggleTerbitSchema,
  async (input) => {
    const supabase = await createSessionSupabaseClient();
    const { error } = await supabase
      .from(input.tabel)
      .update({ is_published: input.is_published } as never)
      .eq("id", input.id);
    if (error) terjemahkanError(error);

    // Proyek butuh slug-nya untuk merevalidasi halaman detail.
    if (input.tabel === "projects") {
      const baris = await ambilBaris("projects", input.id);
      return { slug: (baris?.slug as string | undefined) ?? undefined };
    }
    return { slug: undefined };
  },
  {
    sukses: (i) => (i.is_published ? "Item diterbitkan." : "Item disembunyikan."),
    revalidasi: (i) => ENTITAS_DARI_TABEL[i.tabel],
    konteks: (_i, d) => ({ slug: d.slug, featured: true }),
  },
);

/**
 * Pengurutan: memanggil fungsi database yang menukar nilai secara atomik.
 *
 * Dua UPDATE terpisah dari sisi aplikasi tidak atomik dan bisa meninggalkan
 * dua baris dengan sort_order kembar.
 */
export const urutkanAction = withAdminAction(
  urutkanSchema,
  async (input) => {
    const supabase = await createSessionSupabaseClient();
    const { data, error } = await supabase.rpc("swap_sort_order", {
      p_table: input.tabel,
      p_id: input.id,
      p_direction: input.arah,
    });
    if (error) terjemahkanError(error);
    return { berpindah: data === true };
  },
  {
    sukses: (i) => (i.arah === -1 ? "Item dipindahkan ke atas." : "Item dipindahkan ke bawah."),
    revalidasi: (i) => ENTITAS_DARI_TABEL[i.tabel],
  },
);

export const hapusItemAction = withAdminAction(
  hapusSchema,
  async (input) => {
    const baris = await ambilBaris(input.tabel, input.id);
    const supabase = await createSessionSupabaseClient();

    const { error } = await supabase.from(input.tabel).delete().eq("id", input.id);
    if (error) terjemahkanError(error);

    // Berkas yang hanya dirujuk item ini ikut dibersihkan.
    if (baris) {
      const url: Array<string | null> = [];
      if (typeof baris.thumbnail_url === "string") url.push(baris.thumbnail_url);
      if (typeof baris.image_url === "string") url.push(baris.image_url);
      if (typeof baris.logo_url === "string") url.push(baris.logo_url);
      if (Array.isArray(baris.gallery)) url.push(...(baris.gallery as string[]));
      if (url.length > 0) await hapusBerkas(...url);
    }

    return { slug: (baris?.slug as string | undefined) ?? undefined };
  },
  {
    sukses: "Item dihapus.",
    revalidasi: (i) => ENTITAS_DARI_TABEL[i.tabel],
    konteks: (_i, d) => ({ slug: d.slug, featured: true }),
  },
);

// ---------------------------------------------------------------------------
// Pesan dan rating
// ---------------------------------------------------------------------------

export const tandaiPesanAction = withAdminAction(
  tandaiPesanSchema,
  async (input) => {
    const supabase = await createSessionSupabaseClient();
    const { error } = await supabase
      .from("messages")
      .update({ is_read: input.is_read })
      .eq("id", input.id);
    if (error) terjemahkanError(error);
    return { is_read: input.is_read };
  },
  {
    sukses: (i) =>
      i.is_read ? "Pesan ditandai sudah dibaca." : "Pesan ditandai belum dibaca.",
  },
);

export const moderasiRatingAction = withAdminAction(
  moderasiRatingSchema,
  async (input) => {
    const supabase = await createSessionSupabaseClient();
    const { error } = await supabase
      .from("ratings")
      .update({ is_approved: input.is_approved })
      .eq("id", input.id);
    if (error) terjemahkanError(error);
    return { is_approved: input.is_approved };
  },
  {
    sukses: (i) =>
      i.is_approved ? "Rating disetujui." : "Persetujuan rating dicabut.",
    revalidasi: "ratings",
  },
);

/**
 * Menyimpan pembuka satu halaman.
 *
 * Barisnya sudah disiapkan migrasi untuk setiap halaman profil, jadi aksi ini
 * selalu memperbarui — tidak pernah menyisipkan baris baru dengan kunci
 * halaman karangan sendiri.
 */
export const simpanPembukaHalamanAction = withAdminAction(
  pageIntroSchema,
  (input) => simpanBaris("page_intros", input),
  {
    sukses: "Pembuka halaman tersimpan.",
    revalidasi: "page_intros",
  },
);
