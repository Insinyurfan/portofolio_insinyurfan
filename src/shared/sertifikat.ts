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

const LOGO_KOMDIGI = {
  berkas: "komdigi.png",
  sumber: "https://e-penyiaran.komdigi.go.id/assets/media/logos/komdiginew.png",
};

const LOGO_PENERBIT: Record<string, { berkas: string; sumber: string; latarGelap?: boolean }> = {
  cisco: {
    berkas: "cisco.svg",
    sumber: "https://commons.wikimedia.org/wiki/File:Cisco_logo_blue_2016.svg",
  },
  "ebiz education enterprise": {
    berkas: "ebiz.png",
    sumber: "https://www.ebiz.co.id/images/logo.png",
  },
  "hmti universitas bani saleh": { berkas: "hmti.webp", sumber: "/pengalaman" },
  "institut bisnis muhammadiyah bekasi": {
    berkas: "ibm-bekasi.png",
    sumber: "https://www.idezia.com/2021/11/Daftar.Online.Institut.Bisnis.Muhammadiyah.Bekasi.html",
  },
  kemdiktisaintek: {
    berkas: "kemdiktisaintek.png",
    sumber: "https://kemdiktisaintek.go.id/kemdiktisaintek-logo-akronim.png",
  },
  "kementerian komunikasi dan digital": LOGO_KOMDIGI,
  komdigi: LOGO_KOMDIGI,
  "komdigi digital entrepreneurship academy": LOGO_KOMDIGI,
  "komdigi micro skill": LOGO_KOMDIGI,
  "oracle academy": {
    berkas: "oracle-academy.png",
    sumber: "https://academy.oracle.com/en/oa-assets/i/logo/oa_logo_reverse.png",
    latarGelap: true,
  },
  "pt bentang inspirasi teknologi": { berkas: "bentang-inspirasi-teknologi.webp", sumber: "/pengalaman" },
  "universitas bani saleh": { berkas: "bani-saleh.webp", sumber: "/pengalaman" },
  "world friends korea": {
    berkas: "world-friends-korea.svg",
    sumber: "https://www.worldfriendskorea.or.kr/kor/img/logo_hover.svg",
  },
};

export function logoOtomatisPenerbit(issuer: string | null | undefined) {
  const nama = issuer?.split("·")[0]?.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
  const logo = nama && Object.hasOwn(LOGO_PENERBIT, nama) ? LOGO_PENERBIT[nama] : null;
  return logo ? { url: `/issuer-logos/${logo.berkas}`, sumber: logo.sumber, latarGelap: logo.latarGelap } : null;
}
