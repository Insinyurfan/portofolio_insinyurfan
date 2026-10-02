import type { IconType } from "react-icons";
import {
  SiBehance,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiGitlab,
  SiInstagram,
  SiMedium,
  SiStackoverflow,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { FaLinkedinIn, FaRegEnvelope, FaLink } from "react-icons/fa6";

/**
 * Pemetaan nilai `platform` dari database ke komponen ikon.
 *
 * lucide-react tidak memuat lambang merek, sementara nama platform datang dari
 * data yang nanti diisi admin. Registry dengan fallback berarti platform yang
 * tak terduga tetap tampil rapi sebagai ikon tautan generik, bukan menghilang.
 *
 * Ini pemetaan PRESENTASI, bukan konten — konten tetap sepenuhnya dari
 * database. Lihat design.md → "Ikon: lucide-react untuk UI, react-icons untuk
 * lambang platform".
 */
const REGISTRY: Record<string, { icon: IconType; label: string }> = {
  behance: { icon: SiBehance, label: "Behance" },
  discord: { icon: SiDiscord, label: "Discord" },
  dribbble: { icon: SiDribbble, label: "Dribbble" },
  email: { icon: FaRegEnvelope, label: "Email" },
  facebook: { icon: SiFacebook, label: "Facebook" },
  github: { icon: SiGithub, label: "GitHub" },
  gitlab: { icon: SiGitlab, label: "GitLab" },
  instagram: { icon: SiInstagram, label: "Instagram" },
  linkedin: { icon: FaLinkedinIn, label: "LinkedIn" },
  mail: { icon: FaRegEnvelope, label: "Email" },
  medium: { icon: SiMedium, label: "Medium" },
  stackoverflow: { icon: SiStackoverflow, label: "Stack Overflow" },
  telegram: { icon: SiTelegram, label: "Telegram" },
  threads: { icon: SiThreads, label: "Threads" },
  tiktok: { icon: SiTiktok, label: "TikTok" },
  twitter: { icon: SiX, label: "X" },
  whatsapp: { icon: SiWhatsapp, label: "WhatsApp" },
  x: { icon: SiX, label: "X" },
  youtube: { icon: SiYoutube, label: "YouTube" },
};

export type SocialIconEntry = {
  icon: IconType;
  /** Nama yang dapat diakses, selalu menyebut platformnya. */
  label: string;
};

/**
 * Selalu mengembalikan sesuatu yang dapat dirender. Platform yang tidak dikenal
 * memakai ikon tautan generik, dengan label diambil dari nilai aslinya supaya
 * pembaca layar tetap mendengar nama platformnya.
 */
export function socialIconFor(platform: string): SocialIconEntry {
  const kunci = platform.trim().toLowerCase().replace(/\s+/g, "");
  const terdaftar = REGISTRY[kunci];

  if (terdaftar) return terdaftar;

  const label = platform.trim() === "" ? "Tautan" : platform.trim();
  return { icon: FaLink, label };
}
