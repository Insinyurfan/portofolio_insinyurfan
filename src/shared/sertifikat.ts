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

const LOGO_PENERBIT: Record<string, string> = {
  "cisco": "cisco.svg",
  "ebiz education enterprise": "ebiz.png",
  "hmti universitas bani saleh": "hmti.webp",
  "institut bisnis muhammadiyah bekasi": "ibm-bekasi.png",
  "kemdiktisaintek": "kemdiktisaintek.png",
  "kementerian komunikasi dan digital": "komdigi.png",
  "komdigi": "komdigi.png",
  "komdigi digital entrepreneurship academy": "komdigi.png",
  "komdigi micro skill": "komdigi.png",
  "oracle academy": "oracle-academy.png",
  "pt bentang inspirasi teknologi": "bentang-inspirasi-teknologi.webp",
  "universitas bani saleh": "bani-saleh.webp",
  "world friends korea": "world-friends-korea.svg",
};

export function logoPenerbitSertifikat(item: Pick<Achievement, "issuer" | "issuer_logo_url">) {
  if (item.issuer_logo_url) return item.issuer_logo_url;
  const nama = item.issuer?.split("·")[0]?.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
  const logo = nama && Object.hasOwn(LOGO_PENERBIT, nama) ? LOGO_PENERBIT[nama] : null;
  return logo ? `/issuer-logos/${logo}` : null;
}
