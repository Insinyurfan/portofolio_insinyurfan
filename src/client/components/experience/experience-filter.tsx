import Link from "next/link";

import { cn } from "@/shared/cn";
import { labelExperienceType } from "@/shared/format";
import type { ExperienceType } from "@/shared/types";

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

/**
 * Filter jenis pengalaman sebagai TAUTAN, bukan tombol yang menyaring di
 * peramban.
 *
 * Mengikuti keputusan yang sama seperti filter tech stack di halaman proyek,
 * dan alasannya terukur: menyimpan filter di parameter alamat memaksa halaman
 * dirender ulang di server pada setiap kunjungan, sehingga tidak pernah
 * di-cache CDN. Dengan filter sebagai bagian alamat, setiap pilihan menjadi
 * halaman statis tersendiri.
 *
 * Server Component: tidak ada JavaScript yang dikirim untuknya.
 */
export function ExperienceFilter({
  tersedia,
  aktif,
}: {
  /** Jenis yang benar-benar dipakai entri terbit; yang kosong tidak ditawarkan. */
  tersedia: ExperienceType[];
  /** Jenis yang sedang aktif, atau null untuk "Semua". */
  aktif: ExperienceType | null;
}) {
  if (tersedia.length === 0) return null;

  return (
    <nav
      aria-label="Filter pengalaman berdasarkan jenis"
      className="mb-8 flex flex-wrap gap-2"
    >
      <FilterLink href="/pengalaman" aktif={aktif === null}>
        Semua
      </FilterLink>

      {tersedia.map((jenis) => (
        <FilterLink
          key={jenis}
          href={`/pengalaman/jenis/${SLUG_JENIS[jenis]}`}
          aktif={aktif === jenis}
        >
          {labelExperienceType(jenis)}
        </FilterLink>
      ))}
    </nav>
  );
}

function FilterLink({
  href,
  aktif,
  children,
}: {
  href: string;
  aktif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      // aria-current, bukan aria-pressed: ini tautan ke halaman lain, bukan
      // tombol dua keadaan. Pembaca layar mengumumkannya sebagai halaman saat
      // ini, yang memang benar.
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
        aktif
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border-subtle text-text-muted hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </Link>
  );
}
