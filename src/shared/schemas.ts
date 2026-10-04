import { z } from "zod";

/**
 * Skema validasi per entitas.
 *
 * SATU berkas, diimpor klien maupun server. Klien memakainya lewat
 * react-hook-form untuk umpan balik seketika; server mem-parse ulang input
 * yang sama di dalam `withAdminAction`. Server yang menjadi penentu —
 * aturannya tidak pernah ditulis dua kali, jadi tidak bisa berbeda.
 */

const WAJIB = "Wajib diisi.";

const teksWajib = (maks: number, label = "Isian") =>
  z
    .string()
    .trim()
    .min(1, WAJIB)
    .max(maks, `${label} maksimal ${maks} karakter.`);

const teksOpsional = (maks: number, label = "Isian") =>
  z
    .string()
    .trim()
    .max(maks, `${label} maksimal ${maks} karakter.`)
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v));

const urlOpsional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v))
  .refine(
    (v) => v === null || /^https?:\/\/.+/.test(v),
    "Harus berupa URL lengkap yang diawali http:// atau https://",
  );

const urlWajibLonggar = z
  .string()
  .trim()
  .min(1, WAJIB)
  .refine(
    (v) => /^(https?:\/\/|mailto:|tel:)/.test(v),
    "Harus diawali http://, https://, mailto:, atau tel:",
  );

const tanggalOpsional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v));

const urutan = z.coerce.number().int().min(0).default(0);
const terbit = z.coerce.boolean().default(true);

/** id untuk aksi sunting; kosong berarti pembuatan item baru. */
export const idOpsional = z.string().uuid().optional().nullable();

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  full_name: teksWajib(120, "Nama lengkap"),
  username: teksWajib(60, "Username"),
  // Identitas situs di header. Keduanya opsional: nama situs yang kosong
  // berarti memakai full_name, dan logo yang kosong berarti header hanya
  // menampilkan namanya. Batas 40 karakter sama dengan constraint di
  // database — ruang di header terbatas, dan nama yang terlalu panjang
  // mendorong menu navigasi keluar layar di peranti kecil.
  site_name: teksOpsional(40, "Nama situs"),
  logo_url: urlOpsional,
  // Baris role yang kosong atau hanya spasi dibuang sebelum disimpan.
  roles: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((r) => r.trim()).filter((r) => r !== "")),
  tagline: teksOpsional(200, "Tagline"),
  bio: teksOpsional(5000, "Bio"),
  location: teksOpsional(120, "Lokasi"),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v))
    .refine(
      (v) => v === null || z.string().email().safeParse(v).success,
      "Format email tidak sah.",
    ),
  is_open_to_work: z.coerce.boolean().default(false),
  photo_url: urlOpsional,
  cv_url: urlOpsional,
  is_published: terbit,
});

export type ProfileInput = z.input<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Tautan sosial
// ---------------------------------------------------------------------------

export const socialLinkSchema = z.object({
  id: idOpsional,
  platform: teksWajib(50, "Platform"),
  url: urlWajibLonggar,
  sort_order: urutan,
  is_published: terbit,
});

// ---------------------------------------------------------------------------
// Pendidikan
// ---------------------------------------------------------------------------

const tahun = z.coerce
  .number()
  .int()
  .min(1900, "Tahun tidak masuk akal.")
  .max(2100, "Tahun tidak masuk akal.");

export const educationSchema = z
  .object({
    id: idOpsional,
    institution: teksWajib(150, "Institusi"),
    major: teksOpsional(120, "Jurusan"),
    degree: teksOpsional(60, "Jenjang"),
    // Keduanya opsional: kartu pendidikan tetap utuh tanpa logo maupun lokasi.
    // Batas 120 karakter sama dengan constraint di database.
    location: teksOpsional(120, "Lokasi"),
    logo_url: urlOpsional,
    start_year: tahun,
    end_year: z
      .union([tahun, z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v === "" || v === undefined ? null : v)),
    gpa: z
      .union([z.coerce.number().min(0).max(4), z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v === "" || v === undefined ? null : v)),
    description: teksOpsional(2000, "Deskripsi"),
    sort_order: urutan,
    is_published: terbit,
  })
  .refine(
    (d) => d.end_year === null || d.end_year >= d.start_year,
    {
      message: "Tahun selesai tidak boleh lebih awal daripada tahun mulai.",
      path: ["end_year"],
    },
  );

// ---------------------------------------------------------------------------
// Keahlian
// ---------------------------------------------------------------------------

export const skillCategorySchema = z.object({
  id: idOpsional,
  name: teksWajib(80, "Nama kategori"),
  icon: teksOpsional(60, "Ikon"),
  sort_order: urutan,
  is_published: terbit,
});

export const skillSchema = z.object({
  id: idOpsional,
  category_id: z.string().uuid("Kategori wajib dipilih."),
  name: teksWajib(80, "Nama keahlian"),
  icon: teksOpsional(60, "Ikon"),
  sort_order: urutan,
  is_published: terbit,
});

// ---------------------------------------------------------------------------
// Pengalaman
// ---------------------------------------------------------------------------

export const experienceSchema = z
  .object({
    id: idOpsional,
    position: teksWajib(120, "Posisi"),
    organization: teksWajib(150, "Instansi"),
    type: z.enum(["work", "internship", "organization", "freelance"], {
      message: "Tipe pengalaman wajib dipilih.",
    }),
    start_date: z.string().trim().min(1, WAJIB),
    end_date: tanggalOpsional,
    is_ongoing: z.coerce.boolean().default(false),
    description: teksOpsional(2000, "Deskripsi"),
    sort_order: urutan,
    is_published: terbit,
  })
  // Masih berjalan selalu mengosongkan tanggal selesai: kalau tidak, tampilan
  // harus memilih antara "Sekarang" dan tanggal, dan itu ambigu.
  .transform((d) => (d.is_ongoing ? { ...d, end_date: null } : d))
  .refine(
    (d) => d.end_date === null || d.end_date >= d.start_date,
    {
      message: "Tanggal selesai tidak boleh lebih awal daripada tanggal mulai.",
      path: ["end_date"],
    },
  );

// ---------------------------------------------------------------------------
// Proyek
// ---------------------------------------------------------------------------

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mengubah judul menjadi slug yang aman untuk URL. */
export function keSlug(judul: string): string {
  return judul
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const projectSchema = z.object({
  id: idOpsional,
  title: teksWajib(150, "Judul"),
  slug: z
    .string()
    .trim()
    .min(1, WAJIB)
    .max(80, "Slug maksimal 80 karakter.")
    .regex(
      SLUG_REGEX,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung — tanpa spasi.",
    ),
  summary: teksOpsional(400, "Ringkasan"),
  description: teksOpsional(10000, "Deskripsi"),
  // Nilai kosong dan duplikat dibuang sebelum disimpan.
  tech_stack: z
    .array(z.string())
    .default([])
    .transform((arr) => [
      ...new Set(arr.map((t) => t.trim()).filter((t) => t !== "")),
    ]),
  gallery: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((g) => g.trim()).filter((g) => g !== "")),
  thumbnail_url: urlOpsional,
  demo_url: urlOpsional,
  repo_url: urlOpsional,
  featured: z.coerce.boolean().default(false),
  sort_order: urutan,
  is_published: terbit,
});

// ---------------------------------------------------------------------------
// Pencapaian
// ---------------------------------------------------------------------------

export const achievementSchema = z.object({
  id: idOpsional,
  title: teksWajib(200, "Judul"),
  issuer: teksOpsional(150, "Penerbit"),
  issued_date: tanggalOpsional,
  category: z.enum(["certificate", "award"], {
    message: "Kategori wajib dipilih.",
  }),
  image_url: urlOpsional,
  verification_url: urlOpsional,
  sort_order: urutan,
  is_published: terbit,
});

// ---------------------------------------------------------------------------
// Aksi kecil
// ---------------------------------------------------------------------------

export const toggleTerbitSchema = z.object({
  tabel: z.enum([
    "profile",
    "social_links",
    "education",
    "skill_categories",
    "skills",
    "experiences",
    "projects",
    "achievements",
  ]),
  id: z.string().uuid(),
  is_published: z.coerce.boolean(),
});

export const urutkanSchema = z.object({
  tabel: z.enum([
    "social_links",
    "education",
    "skill_categories",
    "skills",
    "experiences",
    "projects",
    "achievements",
  ]),
  id: z.string().uuid(),
  arah: z.union([z.literal(-1), z.literal(1)]),
});

export const hapusSchema = z.object({
  tabel: z.enum([
    "social_links",
    "education",
    "skill_categories",
    "skills",
    "experiences",
    "projects",
    "achievements",
    "messages",
    "ratings",
  ]),
  id: z.string().uuid(),
});

export const tandaiPesanSchema = z.object({
  id: z.string().uuid(),
  is_read: z.coerce.boolean(),
});

export const moderasiRatingSchema = z.object({
  id: z.string().uuid(),
  is_approved: z.coerce.boolean(),
});

// ---------------------------------------------------------------------------
// Form publik
//
// Nilai dari pengunjung — satu-satunya data di sistem ini yang berasal dari
// orang luar. Setiap field dibatasi panjangnya, dan spasi di ujung dipangkas
// supaya nilai yang hanya berisi spasi diperlakukan sebagai kosong.
// ---------------------------------------------------------------------------

/** Field honeypot. Ikut di skema supaya nilainya terbaca, lalu dibuang. */
const honeypot = z.string().optional();

export const contactMessageSchema = z.object({
  nomor_referensi: honeypot,
  sender_name: teksWajib(100, "Nama"),
  sender_email: z
    .string()
    .trim()
    .min(1, WAJIB)
    .max(200, "Email maksimal 200 karakter.")
    .email("Format email tidak sah."),
  subject: teksOpsional(150, "Subjek"),
  body: teksWajib(5000, "Pesan"),
});

export const visitorRatingSchema = z.object({
  nomor_referensi: honeypot,
  reviewer_name: teksWajib(80, "Nama"),
  stars: z.coerce
    .number()
    .int("Bintang harus bilangan bulat.")
    .min(1, "Pilih bintang dulu, antara 1 sampai 5.")
    .max(5, "Bintang maksimal 5."),
  comment: teksOpsional(1000, "Komentar"),
});
