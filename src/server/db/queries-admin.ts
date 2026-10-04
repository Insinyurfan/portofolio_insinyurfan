import "server-only";

import { createSessionSupabaseClient } from "@/server/db/session";
import type {
  Achievement,
  Education,
  Experience,
  Message,
  PageIntro,
  Profile,
  Project,
  Rating,
  Skill,
  SkillCategory,
  SocialLink,
} from "@/shared/types";

/**
 * Pembacaan untuk dashboard admin.
 *
 * SENGAJA terpisah dari `src/server/db/queries.ts` milik halaman publik.
 *
 * Satu-satunya hal yang menjaga konten draf tersembunyi di sisi publik adalah
 * filter `is_published` di query publik. Kalau fungsi yang sama dipakai admin,
 * cepat atau lambat filter itu akan diberi parameter `includeDrafts`, dan
 * parameter itu akan bocor ke pemanggil publik. Modul terpisah berarti jalur
 * publik tidak punya alasan untuk berubah.
 * Lihat design.md → "Pembacaan admin terpisah".
 *
 * Semua fungsi di sini memakai klien yang sadar sesi, sehingga RLS
 * mengembalikan baris terbit MAUPUN draf.
 */

function lapor(konteks: string, error: { message: string } | null) {
  if (error) console.error(`[queries-admin] ${konteks}: ${error.message}`);
}

export async function adminGetProfile(): Promise<Profile | null> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .limit(1)
    .maybeSingle();
  lapor("adminGetProfile", error);
  return data ?? null;
}

export async function adminGetSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetSocialLinks", error);
  return data ?? [];
}

export async function adminGetEducation(): Promise<Education[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetEducation", error);
  return data ?? [];
}

export async function adminGetSkillCategories(): Promise<SkillCategory[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("skill_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetSkillCategories", error);
  return data ?? [];
}

export async function adminGetSkills(): Promise<Skill[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetSkills", error);
  return data ?? [];
}

export async function adminGetExperiences(): Promise<Experience[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetExperiences", error);
  return data ?? [];
}

export async function adminGetProjects(): Promise<Project[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetProjects", error);
  return data ?? [];
}

export async function adminGetProjectById(id: string): Promise<Project | null> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  lapor("adminGetProjectById", error);
  return data ?? null;
}

export async function adminGetAchievements(): Promise<Achievement[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  lapor("adminGetAchievements", error);
  return data ?? [];
}

/** Pesan, terbaru lebih dulu. */
export async function adminGetMessages(): Promise<Message[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  lapor("adminGetMessages", error);
  return data ?? [];
}

/** Rating, yang menunggu persetujuan ditempatkan lebih dulu. */
export async function adminGetRatings(): Promise<Rating[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  lapor("adminGetRatings", error);
  return data ?? [];
}

export type RingkasanAdmin = {
  proyekTerbit: number;
  proyekDraf: number;
  pesanBelumDibaca: number;
  ratingMenunggu: number;
};

/**
 * Hitungan untuk halaman ringkasan.
 *
 * Dihitung dari database pada setiap permintaan — tidak ada nilai yang
 * disimpan terpisah yang bisa menjadi tidak sinkron.
 */
export async function adminGetRingkasan(): Promise<RingkasanAdmin> {
  const supabase = await createSessionSupabaseClient();

  const [terbit, draf, belumDibaca, menunggu] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("is_published", false),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("ratings")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false),
  ]);

  lapor("adminGetRingkasan/proyekTerbit", terbit.error);
  lapor("adminGetRingkasan/proyekDraf", draf.error);
  lapor("adminGetRingkasan/pesan", belumDibaca.error);
  lapor("adminGetRingkasan/rating", menunggu.error);

  return {
    proyekTerbit: terbit.count ?? 0,
    proyekDraf: draf.count ?? 0,
    pesanBelumDibaca: belumDibaca.count ?? 0,
    ratingMenunggu: menunggu.count ?? 0,
  };
}

export async function adminGetPageIntros(): Promise<PageIntro[]> {
  const supabase = await createSessionSupabaseClient();
  const { data, error } = await supabase
    .from("page_intros")
    .select("*")
    .order("page", { ascending: true });

  lapor("adminGetPageIntros", error);
  return data ?? [];
}
