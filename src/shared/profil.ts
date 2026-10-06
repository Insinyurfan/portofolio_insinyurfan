import type { Profile } from "@/shared/types";

/**
 * Daftar foto profil, dalam urutan tampil.
 *
 * Kolom `photos` dibaca lebih dulu; kalau kosong, `photo_url` lama dipakai
 * sebagai satu-satunya foto. Pemilik yang belum menyentuh field baru tetap
 * melihat fotonya tampil, tanpa perlu mengunggah ulang apa pun.
 *
 * Nilai yang hanya berisi spasi dibuang, supaya daftar tidak pernah memuat
 * entri yang menghasilkan gambar rusak.
 */
export function fotoProfil(profile: Profile): string[] {
  const dariDaftar = profile.photos
    .map((f) => f.trim())
    .filter((f) => f !== "");

  if (dariDaftar.length > 0) return dariDaftar;

  const tunggal = profile.photo_url?.trim();
  return tunggal ? [tunggal] : [];
}

/** Foto utama: yang pertama di daftar, atau null bila belum ada sama sekali. */
export function fotoUtama(profile: Profile): string | null {
  return fotoProfil(profile)[0] ?? null;
}
