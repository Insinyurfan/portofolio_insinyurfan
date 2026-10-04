import type { AchievementCategory, ExperienceType } from "@/shared/types";

/**
 * Helper tampilan.
 *
 * Pemetaan label memakai Record<EnumType, string> yang lengkap, sehingga
 * `tsc --noEmit` GAGAL kalau ada nilai enum baru yang labelnya belum
 * dipetakan. Itu yang membuat syarat "tidak ada nilai enum mentah yang
 * tampil" dijaga compiler, bukan oleh kewaspadaan manusia.
 */

const EXPERIENCE_TYPE_LABEL: Record<ExperienceType, string> = {
  work: "Kerja",
  internship: "Magang",
  organization: "Organisasi",
  freelance: "Freelance",
};

const ACHIEVEMENT_CATEGORY_LABEL: Record<AchievementCategory, string> = {
  certificate: "Sertifikat",
  award: "Penghargaan",
};

export function labelExperienceType(type: ExperienceType): string {
  return EXPERIENCE_TYPE_LABEL[type];
}

export function labelAchievementCategory(category: AchievementCategory): string {
  return ACHIEVEMENT_CATEGORY_LABEL[category];
}

const BULAN_TAHUN = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const TANGGAL_LENGKAP = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function keDate(nilai: string): Date | null {
  const tanggal = new Date(`${nilai}T00:00:00Z`);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

/** "Maret 2025" — untuk rentang pengalaman. */
export function formatBulanTahun(nilai: string): string {
  const tanggal = keDate(nilai);
  return tanggal ? BULAN_TAHUN.format(tanggal) : nilai;
}

/** "15 Maret 2025" — untuk tanggal pencapaian. */
export function formatTanggal(nilai: string): string {
  const tanggal = keDate(nilai);
  return tanggal ? TANGGAL_LENGKAP.format(tanggal) : nilai;
}

/**
 * Rentang tanggal pengalaman. Yang masih berjalan berakhir dengan "Sekarang"
 * sebagai ganti tanggal selesai.
 */
export function formatRentangTanggal(
  mulai: string,
  selesai: string | null,
  masihBerjalan: boolean,
): string {
  const awal = formatBulanTahun(mulai);

  if (masihBerjalan || selesai === null) {
    return `${awal} – Sekarang`;
  }

  return `${awal} – ${formatBulanTahun(selesai)}`;
}

/** Rentang tahun pendidikan. Tanpa tahun selesai dibaca sebagai masih berjalan. */
export function formatRentangTahun(
  mulai: number,
  selesai: number | null,
): string {
  return selesai === null ? `${mulai} – Sekarang` : `${mulai} – ${selesai}`;
}

/** IPK dengan dua angka desimal, atau null kalau tidak diisi. */
export function formatIpk(gpa: number | null): string | null {
  if (gpa === null) return null;
  return gpa.toFixed(2).replace(".", ",");
}

/**
 * Bio dan deskripsi disimpan sebagai teks dengan baris baru. Dipecah menjadi
 * paragraf supaya pemisahannya terjaga saat dirender, tanpa pernah menyisipkan
 * HTML dari database.
 */
export function keParagraf(teks: string | null): string[] {
  if (!teks) return [];

  return teks
    .split(/\n\s*\n/)
    .map((paragraf) => paragraf.trim())
    .filter((paragraf) => paragraf !== "");
}

/**
 * Mengubah nama tech stack menjadi potongan alamat yang aman untuk URL.
 *
 * "Next.js" → "nextjs", "Tailwind CSS" → "tailwind-css".
 *
 * Fungsi murni tanpa akses database, jadi tempatnya di sini — bukan di modul
 * query. Filter tech di halaman proyek membangun tautannya dengan fungsi ini,
 * dan komponen tidak perlu ikut menarik seluruh lapisan database hanya untuk
 * membuat sebuah slug.
 */
export function techKeSlug(tech: string): string {
  return tech
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
