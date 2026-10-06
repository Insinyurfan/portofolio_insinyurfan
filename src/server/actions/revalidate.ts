import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Peta revalidasi terpusat: entitas → halaman publik yang terdampak.
 *
 * Ditulis di satu tempat karena `revalidatePath` pada route dinamis memerlukan
 * path KONKRET. Slug lama akan tetap ter-cache kalau tidak disebut eksplisit —
 * itu bug yang paling mudah terjadi di sini, dan sudah menjadi skenario
 * tersendiri di spesifikasi `admin-revalidation`.
 */

export type Entitas =
  | "profile"
  | "social_links"
  | "education"
  | "skill_categories"
  | "skills"
  | "experiences"
  | "projects"
  | "achievements"
  | "messages"
  | "ratings"
  | "page_intros";

/** Konteks tambahan untuk entitas yang punya halaman per-item. */
export type KonteksRevalidasi = {
  /** Slug proyek yang terdampak. */
  slug?: string;
  /** Slug sebelum diubah — wajib disertakan saat slug berganti. */
  slugLama?: string;
};

const PATH_PER_ENTITAS: Record<Entitas, string[]> = {
  // Profil dan tautan sosial tampil di navigasi dan footer SETIAP halaman,
  // jadi keduanya merevalidasi seluruh layout, bukan satu path.
  profile: [],
  social_links: [],

  // Setiap entitas di bawah ini ikut menyertakan "/".
  //
  // Beranda kini satu halaman yang memuat SELURUH bagian situs. Tanpa "/" di
  // sini, menyunting satu entri hanya memperbarui halaman khususnya, sementara
  // beranda tetap menyajikan versi lama sampai periode revalidasi habis —
  // persis yang terjadi ketika logo institusi yang baru diunggah tampil di
  // /pendidikan tetapi tidak di beranda.
  education: ["/pendidikan", "/"],
  skill_categories: ["/keahlian", "/"],
  skills: ["/keahlian", "/"],
  experiences: ["/pengalaman", "/"],
  achievements: ["/pencapaian", "/"],
  projects: ["/proyek", "/sitemap.xml", "/"],

  // Pembuka halaman muncul di SEMUA halaman profil sekaligus, jadi
  // revalidasinya menyeluruh — sama seperti profil dan tautan sosial.
  page_intros: [],

  // Pesan tidak pernah tampil di halaman publik.
  messages: [],

  // Rating yang disetujui tampil di beranda, beserta rata-ratanya. Menyetujui,
  // mencabut persetujuan, dan menghapus rating semuanya mengubah apa yang
  // terlihat di sana.
  ratings: ["/"],
};

const SELURUH_LAYOUT: Entitas[] = ["profile", "social_links", "page_intros"];

/**
 * Membatalkan cache setiap halaman publik yang menampilkan entitas ini.
 *
 * Melempar error bila revalidasi gagal — pemanggil (pembungkus aksi) yang
 * memutuskan bahwa kegagalan ini TIDAK membatalkan perubahan data.
 */
export function revalidasiUntuk(
  entitas: Entitas,
  konteks: KonteksRevalidasi = {},
): void {
  if (SELURUH_LAYOUT.includes(entitas)) {
    // Satu panggilan ini mencakup seluruh halaman publik sekaligus.
    revalidatePath("/", "layout");
    return;
  }

  for (const path of PATH_PER_ENTITAS[entitas]) {
    revalidatePath(path);
  }

  /**
   * Halaman terfilter ikut dibatalkan lewat POLA route-nya.
   *
   * `revalidatePath("/proyek")` tidak mencakup `/proyek/tech/react` — itu
   * berkas halaman yang berbeda. Tanpa baris di bawah, tampilan terfilter
   * tetap menyajikan data lama sampai periode revalidasinya habis, padahal
   * halaman induknya sudah diperbarui.
   */
  if (entitas === "projects") {
    revalidatePath("/proyek/tech/[tech]", "page");

    // Halaman detail: path konkret, termasuk slug lama saat slug berganti.
    if (konteks.slug) revalidatePath(`/proyek/${konteks.slug}`);
    if (konteks.slugLama && konteks.slugLama !== konteks.slug) {
      revalidatePath(`/proyek/${konteks.slugLama}`);
    }
  }

  if (entitas === "experiences") {
    revalidatePath("/pengalaman/jenis/[jenis]", "page");
  }

}
