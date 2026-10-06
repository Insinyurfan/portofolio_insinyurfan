"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import { cn } from "@/shared/cn";
import type { SkillGroup } from "@/shared/types";

const LABEL_TINGKAT: Record<string, string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  mahir: "Mahir",
};

/**
 * Keahlian per kategori, dengan tab untuk berpindah kelompok.
 *
 * SELURUH panel ikut dirender ke HTML, dan yang tidak aktif disembunyikan
 * dengan atribut `hidden` — bukan dibuang dari pohon React. Dua alasan: mesin
 * pencari dan pembaca layar tetap menemukan semua keahlian di halaman ini, dan
 * berpindah tab tidak memerlukan render ulang sehingga terasa seketika.
 *
 * Tab-nya memakai pola ARIA tabs: panah kiri/kanan berpindah antar tab, dan
 * hanya tab aktif yang masuk urutan Tab keyboard.
 */
export function SkillsTabs({ groups }: { groups: SkillGroup[] }) {
  const [aktif, setAktif] = useState(0);
  const idDasar = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Satu kategori tidak memerlukan tab — ia hanya menambah kontrol yang tidak
  // mengubah apa pun.
  const pakaiTab = groups.length > 1;

  function keTab(index: number) {
    const tujuan = (index + groups.length) % groups.length;
    setAktif(tujuan);
    tabRefs.current[tujuan]?.focus();
  }

  return (
    <div>
      {pakaiTab ? (
        <div
          role="tablist"
          aria-label="Kelompok keahlian"
          className="mb-8 flex flex-wrap gap-2"
        >
          {groups.map((group, index) => (
            <button
              key={group.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${idDasar}-tab-${index}`}
              aria-controls={`${idDasar}-panel-${index}`}
              aria-selected={index === aktif}
              // Hanya tab aktif yang dapat dicapai lewat Tab; sisanya lewat
              // tombol panah. Itu pola ARIA tabs, dan mencegah pengguna
              // keyboard harus menekan Tab sebanyak jumlah kategori hanya
              // untuk melewati daftar ini.
              tabIndex={index === aktif ? 0 : -1}
              onClick={() => setAktif(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  keTab(index + 1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  keTab(index - 1);
                }
              }}
              className={cn(
                "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
                index === aktif
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border-subtle text-text-muted hover:border-accent hover:text-accent",
              )}
            >
              {group.name}
            </button>
          ))}
        </div>
      ) : null}

      {groups.map((group, index) => (
        <div
          key={group.id}
          id={`${idDasar}-panel-${index}`}
          role={pakaiTab ? "tabpanel" : undefined}
          aria-labelledby={pakaiTab ? `${idDasar}-tab-${index}` : undefined}
          hidden={pakaiTab && index !== aktif}
          tabIndex={pakaiTab ? 0 : undefined}
        >
          <KelompokKeahlian group={group} />
        </div>
      ))}
    </div>
  );
}

function KelompokKeahlian({ group }: { group: SkillGroup }) {
  return (
    <section>
      <div className="flex flex-col gap-3 border-b border-border-subtle pb-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0">
          {group.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
              {group.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 font-heading text-2xl font-bold text-text sm:text-3xl">
            {group.name}
          </h2>
        </div>

        {group.description ? (
          <p className="prosa text-sm leading-relaxed text-text-muted lg:max-w-md lg:text-right">
            {group.description}
          </p>
        ) : null}
      </div>

      <ul className="mt-6 grid list-none grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {group.skills.map((skill) => (
          <li
            key={skill.id}
            className="rounded-card border border-border-subtle bg-surface-raised p-5 transition-shadow hover:shadow-card"
          >
            <LogoKeahlian logoUrl={skill.logo_url} nama={skill.name} />

            <p className="mt-4 font-heading text-base font-bold text-text">
              {skill.name}
            </p>

            {/* Baris keterangan hanya dirender kalau salah satu nilainya ada —
                bukan sebagai "Sejak — · —" yang tidak memberi informasi. */}
            {skill.since_year || skill.level ? (
              <p className="mt-1 text-sm text-text-muted">
                {[
                  skill.since_year ? `Sejak ${skill.since_year}` : null,
                  skill.level ? LABEL_TINGKAT[skill.level] : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Logo alat, atau inisialnya bila logo belum diunggah. */
function LogoKeahlian({
  logoUrl,
  nama,
}: {
  logoUrl: string | null;
  nama: string;
}) {
  const kelas =
    "flex size-12 items-center justify-center overflow-hidden rounded-card border border-border-subtle";

  if (logoUrl) {
    return (
      // Ubin putih: latar putih pada logo menyatu dengannya, sehingga tidak
      // muncul kotak di dalam kotak.
      <div className={cn(kelas, "bg-surface-raised")}>
        <Image
          src={logoUrl}
          // Nama alatnya sudah tertulis tepat di bawah logo ini.
          alt=""
          width={48}
          height={48}
          className="size-full object-contain p-1"
        />
      </div>
    );
  }

  const inisial = nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={cn(kelas, "bg-surface-sunken")} aria-hidden="true">
      <span className="font-heading text-sm font-bold text-text-subtle">
        {inisial || "?"}
      </span>
    </div>
  );
}
