import Link from "next/link";

import { cn } from "@/shared/cn";
import { techKeSlug } from "@/shared/format";

/**
 * Filter tech stack sebagai TAUTAN, bukan tombol yang menulis search param.
 *
 * Alasannya kecepatan, dan ini terukur. Versi sebelumnya menyimpan filter di
 * `?tech=`, yang memaksa `/proyek` dirender ulang di server pada setiap
 * kunjungan — halaman itu tidak pernah di-cache CDN dan LCP-nya sekitar
 * 1,2 detik, enam kali lebih lambat daripada halaman publik lain.
 *
 * Dengan filter sebagai bagian alamat, setiap kombinasi menjadi halaman
 * statis tersendiri yang di-prerender saat build dan dilayani dari CDN. Tautan
 * terfilter tetap dapat dibagikan dan tetap dirender di server — jadi tidak
 * ada yang hilang dari sisi SEO maupun berbagi tautan.
 *
 * Komponen ini kini Server Component: tidak ada JavaScript yang dikirim
 * untuknya sama sekali.
 */
export function TechFilter({
  options,
  active,
}: {
  options: string[];
  /** Tech stack yang sedang aktif, atau null untuk "Semua". */
  active: string | null;
}) {
  if (options.length === 0) return null;

  return (
    <nav
      aria-label="Filter proyek berdasarkan tech stack"
      className="mb-8 flex flex-wrap gap-2"
    >
      <FilterLink href="/proyek" aktif={active === null}>
        Semua
      </FilterLink>

      {options.map((tech) => (
        <FilterLink
          key={tech}
          href={`/proyek/tech/${techKeSlug(tech)}`}
          aktif={active === tech}
        >
          {tech}
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
      // aria-current memberi tahu teknologi bantu filter mana yang sedang
      // berlaku — peran yang sama dengan aria-pressed pada versi tombol.
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
        aktif
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border-strong text-text-muted hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </Link>
  );
}
