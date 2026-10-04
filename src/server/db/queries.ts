import "server-only";

import { createServerSupabaseClient } from "@/server/db/client";
import { techKeSlug } from "@/shared/format";
import type {
  Achievement,
  Education,
  Experience,
  Profile,
  Project,
  PageIntro,
  Rating,
  RingkasanRating,
  SkillCategory,
  SkillGroup,
  SocialLink,
} from "@/shared/types";

/**
 * Lapisan akses data untuk halaman publik.
 *
 * SEMUA fungsi di berkas ini memfilter is_published = true dan mengurutkan
 * dengan pengurutan sekunder yang deterministik. Aturan itu ditulis di sini
 * saja, tidak diulang di delapan halaman — satu halaman yang lupa memfilter
 * berarti kebocoran konten draf.
 *
 * Ketika dashboard admin nanti butuh pembacaan yang menyertakan draf, ia
 * MENAMBAH modul sendiri (lib/queries/admin/) alih-alih memberi parameter
 * includeDrafts ke fungsi di sini.
 * Lihat design.md → "Lapisan query khusus server di lib/queries/".
 */

/** Kolom yang dibaca untuk daftar proyek — tanpa deskripsi panjang. */
const PROJECT_CARD_COLUMNS =
  "id, title, slug, summary, tech_stack, thumbnail_url, featured, sort_order, is_published, created_at, updated_at, description, gallery, demo_url, repo_url";

function laporkan(konteks: string, error: { message: string } | null): void {
  if (error) {
    // Dicatat di server; halaman menampilkan empty state alih-alih meledak.
    console.error(`[queries] ${konteks} gagal: ${error.message}`);
  }
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();

  laporkan("getProfile", error);
  return data ?? null;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getSocialLinks", error);
  return data ?? [];
}

export async function getEducation(): Promise<Education[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("education")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getEducation", error);
  return data ?? [];
}

/**
 * Keahlian dikelompokkan per kategori, keduanya menurut urutan tersimpan.
 * Kategori yang tidak punya keahlian terbit TIDAK dikembalikan — spesifikasi
 * meminta kategori kosong tidak dirender.
 */
export async function getSkillsByCategory(): Promise<SkillGroup[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("skill_categories")
    .select("*, skills(*)")
    .eq("is_published", true)
    .eq("skills.is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .order("sort_order", { referencedTable: "skills", ascending: true })
    .order("id", { referencedTable: "skills", ascending: true });

  laporkan("getSkillsByCategory", error);

  const kategori = (data ?? []) as Array<SkillCategory & { skills: SkillGroup["skills"] }>;

  return kategori
    .map((baris) => ({ ...baris, skills: baris.skills ?? [] }))
    .filter((baris) => baris.skills.length > 0);
}

export async function getExperiences(): Promise<Experience[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getExperiences", error);
  return data ?? [];
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_CARD_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getProjects", error);
  return data ?? [];
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_CARD_COLUMNS)
    .eq("is_published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getFeaturedProjects", error);
  return data ?? [];
}

/** Null kalau slug tidak ada ATAU proyeknya belum terbit — pemanggil memanggil notFound(). */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  laporkan(`getProjectBySlug(${slug})`, error);
  return data ?? null;
}

/** Slug proyek terbit, untuk generateStaticParams dan sitemap. */
export async function getPublishedProjectSlugs(): Promise<
  Array<Pick<Project, "slug" | "updated_at">>
> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getPublishedProjectSlugs", error);
  return data ?? [];
}

export async function getAchievements(): Promise<Achievement[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  laporkan("getAchievements", error);
  return data ?? [];
}

/**
 * Gabungan tech stack dari proyek terbit, tanpa duplikat, untuk pilihan filter.
 * Dihitung dari data — tidak ada daftar yang ditulis di kode.
 */
export function collectTechStack(projects: Project[]): string[] {
  const unik = new Set<string>();

  for (const project of projects) {
    for (const tech of project.tech_stack) {
      const bersih = tech.trim();
      if (bersih !== "") unik.add(bersih);
    }
  }

  return [...unik].sort((a, b) => a.localeCompare(b, "id"));
}

/**
 * Rata-rata dan jumlah rating yang sudah disetujui.
 *
 * Diambil dari view agregat, bukan dihitung di aplikasi: dengan begitu angka
 * yang ditampilkan dan daftar yang dirender berasal dari satu sumber dan tidak
 * bisa tidak sinkron. View-nya juga tidak pernah mengembalikan baris individu.
 */
export async function getRatingSummary(): Promise<RingkasanRating> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("rating_summary")
    .select("total, average")
    .maybeSingle();

  laporkan("getRatingSummary", error);

  return {
    total: data?.total ?? 0,
    average: Number(data?.average ?? 0),
  };
}

/**
 * Rating yang sudah disetujui, terbaru lebih dulu.
 *
 * RLS sudah membatasi ke baris yang disetujui; filter di sini adalah lapisan
 * kedua, bukan satu-satunya penjaga.
 */
export async function getApprovedRatings(): Promise<Rating[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("is_approved", true)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  laporkan("getApprovedRatings", error);
  return data ?? [];
}

/**
 * Seluruh tech stack yang dipakai proyek terbit, beserta slug-nya.
 *
 * Dipakai `generateStaticParams` untuk membuat satu halaman statis per tech
 * stack, sehingga halaman proyek yang terfilter ikut di-cache CDN alih-alih
 * dirender ulang setiap kunjungan.
 */
export async function getTechStackSlugs(): Promise<
  Array<{ tech: string; slug: string }>
> {
  const projects = await getProjects();

  const peta = new Map<string, string>();
  for (const tech of collectTechStack(projects)) {
    const slug = techKeSlug(tech);
    if (slug !== "" && !peta.has(slug)) peta.set(slug, tech);
  }

  return [...peta.entries()].map(([slug, tech]) => ({ tech, slug }));
}

/**
 * Blok pembuka satu halaman publik.
 *
 * Mengembalikan null kalau pemiliknya belum mengisi judulnya. Halaman yang
 * mendapat null merender bentuk tanpa pembuka — jadi menambahkan tabel ini
 * tidak mengubah tampilan situs sampai ada yang memutuskan mengisinya.
 */
export async function getPageIntro(page: string): Promise<PageIntro | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("page_intros")
    .select("*")
    .eq("page", page)
    .eq("is_published", true)
    .maybeSingle();

  laporkan("getPageIntro", error);

  // Judul kosong diperlakukan sama dengan "belum diisi": blok pembuka tanpa
  // judul hanya menampilkan label kecil yang menggantung tanpa konteks.
  if (!data || data.headline === null || data.headline.trim() === "") return null;
  return data;
}
