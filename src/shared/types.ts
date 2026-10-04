/**
 * Alias ringkas di atas tipe database yang dihasilkan, supaya komponen tidak
 * perlu menulis Database["public"]["Tables"][...]["Row"] berulang kali.
 */

import type { Enums, Tables } from "./database.types";

export type Profile = Tables<"profile">;
export type SocialLink = Tables<"social_links">;
export type Education = Tables<"education">;
export type SkillCategory = Tables<"skill_categories">;
export type Skill = Tables<"skills">;
export type Experience = Tables<"experiences">;
export type Project = Tables<"projects">;
export type Achievement = Tables<"achievements">;
export type Message = Tables<"messages">;
export type Rating = Tables<"ratings">;

export type ExperienceType = Enums<"experience_type">;
export type AchievementCategory = Enums<"achievement_category">;

/** Satu kategori beserta keahlian terbit di dalamnya, siap dirender. */
export type SkillGroup = SkillCategory & {
  skills: Skill[];
};

/** Tabel yang punya kolom sort_order dan dapat diurutkan lewat tombol naik/turun. */
export const ORDERABLE_TABLES = [
  "social_links",
  "education",
  "skill_categories",
  "skills",
  "experiences",
  "projects",
  "achievements",
] as const;

export type OrderableTable = (typeof ORDERABLE_TABLES)[number];

/** Rata-rata dan jumlah rating yang sudah disetujui. */
export type RingkasanRating = {
  /** Jumlah rating yang sudah disetujui. */
  total: number;
  /** Rata-rata bintang, 0 kalau belum ada rating yang disetujui. */
  average: number;
};
