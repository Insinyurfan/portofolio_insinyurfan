import type { Achievement } from "@/shared/types";

export const SARAN_KATEGORI_SERTIFIKAT = [
  "Sertifikasi Internasional",
  "Sertifikasi Nasional",
  "Kegiatan Kampus",
  "Pelatihan & Workshop",
  "Seminar & Webinar",
  "Penghargaan",
  "Lainnya",
];

export function kategoriSertifikat(item: Pick<Achievement, "certificate_category" | "category">) {
  return item.certificate_category?.trim() || (item.category === "award" ? "Penghargaan" : "Lainnya");
}

export function kunciKategori(kategori: string) {
  return kategori.trim().toLocaleLowerCase("id-ID");
}

export function daftarKategori(items: string[]) {
  const kategori = new Map<string, string>();
  for (const item of items) {
    const kunci = kunciKategori(item);
    if (!kategori.has(kunci)) kategori.set(kunci, item);
  }
  return [...kategori.values()].sort((a, b) => a.localeCompare(b, "id-ID"));
}
