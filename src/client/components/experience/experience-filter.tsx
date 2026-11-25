import Link from "next/link";

import { cn } from "@/shared/cn";
import { labelExperienceType } from "@/shared/format";
import type { Experience, ExperienceType } from "@/shared/types";

/**
 * Slug alamat untuk setiap jenis pengalaman.
 *
 * Ditulis eksplisit, bukan diturunkan dari nilai enumnya, karena alamat yang
 * dilihat pengunjung sebaiknya berbahasa Indonesia — "/pengalaman/jenis/magang",
 * bukan "/internship". Peta ini juga yang membuat perubahan label tidak ikut
 * mengubah alamat yang mungkin sudah dibagikan orang.
 */
export const SLUG_JENIS: Record<ExperienceType, string> = {
  work: "kerja",
  internship: "magang",
  organization: "organisasi",
  freelance: "lepas",
};

/** Kebalikan SLUG_JENIS; null bila slugnya tidak dikenal. */
export function jenisDariSlug(slug: string): ExperienceType | null {
  const cocok = (Object.keys(SLUG_JENIS) as ExperienceType[]).find(
    (jenis) => SLUG_JENIS[jenis] === slug,
  );
  return cocok ?? null;
}

export function jenisPengalamanTersedia(items: Experience[]): ExperienceType[] {
  return (Object.keys(SLUG_JENIS) as ExperienceType[]).filter(
    (jenis) => items.some((item) => item.type === jenis),
  );
}

/** Beranda menyaring daftar di tempat. Halaman pengalaman memakai tautan per jenis. */
export function ExperienceFilter({
  tersedia,
  aktif,
  onPilih,
}: {
  /** Jenis yang benar-benar dipakai entri terbit; yang kosong tidak ditawarkan. */
  tersedia: ExperienceType[];
  /** Jenis yang sedang aktif, atau null untuk "Semua". */
  aktif: ExperienceType | null;
  onPilih?: (jenis: ExperienceType | null) => void;
}) {
  if (tersedia.length === 0) return null;

  const pilihan = [null, ...tersedia];
  return (
    <nav
      aria-label="Filter pengalaman berdasarkan jenis"
      className="w-fit max-w-full rounded-card border border-border-subtle bg-surface-sunken p-1.5"
    >
      <ul className="flex list-none flex-wrap gap-1">
        {pilihan.map((jenis) => {
          const terpilih = aktif === jenis;
          const label = jenis ? labelExperienceType(jenis) : "Semua";
          const kelas = cn(
            "inline-flex min-h-10 items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
            terpilih
              ? "bg-accent text-accent-contrast"
              : "text-text-muted hover:bg-surface-raised hover:text-accent",
          );

          return (
            <li key={jenis ?? "semua"}>
              {onPilih ? (
                <button type="button" aria-pressed={terpilih} onClick={() => onPilih(jenis)} className={kelas}>
                  {label}
                </button>
              ) : (
                <Link
                  href={jenis ? `/pengalaman/jenis/${SLUG_JENIS[jenis]}` : "/pengalaman"}
                  aria-current={terpilih ? "page" : undefined}
                  className={kelas}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
