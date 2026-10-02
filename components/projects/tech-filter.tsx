"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/cn";

/**
 * Filter tech stack.
 *
 * State disimpan di URL search param `?tech=` supaya tampilan terfilter dapat
 * dibagikan dan tombol kembali bekerja seperti harapan pengunjung. Server yang
 * membaca param itu, jadi tautan terfilter yang dibagikan langsung dirender
 * terfilter. Lihat design.md → "State filter proyek disimpan di URL".
 *
 * Dibuat dari elemen <button> di dalam satu grup bernama, sehingga setiap
 * pilihan dapat dicapai keyboard dan status terpilihnya diumumkan lewat
 * aria-pressed.
 */
export function TechFilter({
  options,
  active,
}: {
  options: string[];
  active: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (options.length === 0) return null;

  function pilih(tech: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (tech === null) {
      params.delete("tech");
    } else {
      params.set("tech", tech);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Filter proyek berdasarkan tech stack"
      className="mb-8 flex flex-wrap gap-2"
    >
      <FilterButton aktif={active === null} onClick={() => pilih(null)}>
        Semua
      </FilterButton>

      {options.map((tech) => (
        <FilterButton
          key={tech}
          aktif={active === tech}
          onClick={() => pilih(active === tech ? null : tech)}
        >
          {tech}
        </FilterButton>
      ))}
    </div>
  );
}

function FilterButton({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
        aktif
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border-strong text-text-muted hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
