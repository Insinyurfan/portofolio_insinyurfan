import "server-only";

import { randomUUID } from "node:crypto";

import { STORAGE_BUCKET } from "@/lib/constants";
import { env } from "@/lib/env";
import { createSessionSupabaseClient } from "@/lib/supabase/session";
import { AksiError } from "@/lib/admin/action";

/**
 * Helper Storage.
 *
 * Catatan konteks: spesifikasi `portfolio-content-model` menyimpan media
 * sebagai URL, sedangkan menghapus berkas membutuhkan PATH objek. Daripada
 * mengubah kolom (dan ikut mengubah spesifikasi serta kode halaman publik),
 * path diturunkan dari URL — prefiks publik Supabase bentuknya tetap.
 * Lihat design.md → "Path Storage diturunkan dari URL yang tersimpan".
 */

const PREFIKS_PUBLIK = `${env.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`;

export type PrefiksMedia = "profile" | "projects" | "achievements" | "cv";

const JENIS_GAMBAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MAKS_GAMBAR = 5 * 1024 * 1024; // 5 MB
const MAKS_PDF = 10 * 1024 * 1024; // 10 MB

function formatUkuran(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** URL publik → path objek. Null bila URL bukan milik bucket kita. */
export function urlKePath(url: string | null): string | null {
  if (!url) return null;
  if (!url.startsWith(PREFIKS_PUBLIK)) return null;
  const path = url.slice(PREFIKS_PUBLIK.length);
  return path === "" ? null : decodeURIComponent(path);
}

/** Path objek → URL publik. */
export function pathKeUrl(path: string): string {
  return `${PREFIKS_PUBLIK}${path}`;
}

/**
 * Mengunggah satu berkas dan mengembalikan URL publiknya.
 *
 * Validasi jenis dan ukuran terjadi DI SINI, di server — bukan hanya lewat
 * atribut `accept` di form, yang bisa dilewati begitu saja.
 */
export async function unggahBerkas(
  file: File,
  prefiks: PrefiksMedia,
  jenis: "gambar" | "pdf",
): Promise<string> {
  if (file.size === 0) {
    throw new AksiError("Berkas kosong atau gagal terbaca.", "validasi");
  }

  let ekstensi: string;

  if (jenis === "pdf") {
    if (file.type !== "application/pdf") {
      throw new AksiError(
        "Hanya berkas PDF yang diterima untuk CV.",
        "validasi",
      );
    }
    if (file.size > MAKS_PDF) {
      throw new AksiError(
        `Ukuran PDF maksimal ${formatUkuran(MAKS_PDF)}.`,
        "validasi",
      );
    }
    ekstensi = "pdf";
  } else {
    const cocok = JENIS_GAMBAR[file.type];
    if (!cocok) {
      throw new AksiError(
        "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, AVIF, GIF, atau SVG.",
        "validasi",
      );
    }
    if (file.size > MAKS_GAMBAR) {
      throw new AksiError(
        `Ukuran gambar maksimal ${formatUkuran(MAKS_GAMBAR)}.`,
        "validasi",
      );
    }
    ekstensi = cocok;
  }

  // Nama dihasilkan sistem: dua unggahan dengan nama asal yang sama tidak
  // pernah saling menimpa, dan nama berkas dari perangkat admin tidak ikut
  // terbit di URL publik.
  const path = `${prefiks}/${randomUUID()}.${ekstensi}`;

  const supabase = await createSessionSupabaseClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[storage] unggah gagal:", error.message);
    throw new AksiError("Berkas gagal diunggah. Coba lagi.", "server");
  }

  return pathKeUrl(path);
}

/**
 * Menghapus berkas lama.
 *
 * Dipanggil HANYA setelah baris database yang menunjuk berkas baru berhasil
 * tersimpan. Urutan itu membuat kegagalan terburuk hanya menyisakan berkas
 * tak terpakai di Storage, bukan gambar rusak di halaman publik.
 *
 * URL yang tidak menunjuk bucket kita (misalnya gambar yang di-host di tempat
 * lain) dilewati, bukan dianggap error. Begitu juga berkas yang memang sudah
 * tidak ada — aksinya tetap selesai dengan sukses.
 */
export async function hapusBerkas(...urls: Array<string | null>): Promise<void> {
  const paths = urls
    .map(urlKePath)
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    // Dicatat supaya bisa dibersihkan belakangan; tidak pernah dilemparkan ke
    // admin, karena datanya sendiri sudah tersimpan dengan benar.
    console.error("[storage] gagal menghapus berkas lama:", error.message, paths);
    return;
  }

  // Penghapusan yang "berhasil" tetapi tidak menyentuh berkas apa pun adalah
  // kegagalan yang paling mudah terlewat: API tidak mengembalikan error, dan
  // satu-satunya gejalanya adalah berkas yang menumpuk di Storage. Itu pernah
  // terjadi di proyek ini karena role authenticated belum punya hak SELECT
  // pada bucket. Jadi keadaan itu dicatat secara eksplisit.
  const terhapus = data?.length ?? 0;
  if (terhapus < paths.length) {
    console.warn(
      `[storage] diminta menghapus ${paths.length} berkas, yang benar-benar terhapus ${terhapus}.`,
      paths,
    );
  }
}

/** Mengambil berkas dari FormData, atau null bila tidak ada yang dipilih. */
export function ambilFile(formData: FormData, nama: string): File | null {
  const nilai = formData.get(nama);
  if (!(nilai instanceof File)) return null;
  if (nilai.size === 0) return null;
  return nilai;
}
