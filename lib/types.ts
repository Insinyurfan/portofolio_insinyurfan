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
