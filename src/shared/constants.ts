/**
 * Periode revalidasi ISR untuk seluruh route publik, dalam detik.
 *
 * Diekspor dari satu tempat supaya delapan route tidak bisa menjadi tidak
 * konsisten. Lima menit cukup cepat agar pengeditan terasa langsung, cukup
 * lambat agar lalu lintas biasa tidak memukul database.
 *
 * Ketika dashboard admin hadir, ia akan memanggil revalidasi on-demand setelah
 * penyimpanan dan angka ini menjadi jaring pengaman.
 */
export const REVALIDATE = 300;

/** Nama bucket Storage. Satu konstanta supaya penggantian nama cukup di sini. */
export const STORAGE_BUCKET = "media";

/** Navigasi publik. Satu sumber untuk navbar, footer, dan sitemap. */
export const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/pendidikan", label: "Pendidikan" },
  { href: "/keahlian", label: "Keahlian" },
  { href: "/pengalaman", label: "Pengalaman" },
  { href: "/proyek", label: "Proyek" },
  { href: "/pencapaian", label: "Pencapaian" },
  { href: "/kontak", label: "Kontak" },
] as const;
