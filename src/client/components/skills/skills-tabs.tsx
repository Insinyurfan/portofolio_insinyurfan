"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Layers3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";

import { Modal } from "@/client/components/ui/modal";
import { EmptyState } from "@/client/components/ui/primitives";
import { cn } from "@/shared/cn";
import type { PageIntro, Skill, SkillGroup } from "@/shared/types";

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
export function SkillsTabs({
  groups,
  halaman = false,
  intro,
}: {
  groups: SkillGroup[];
  halaman?: boolean;
  intro?: Pick<PageIntro, "eyebrow" | "headline" | "description"> | null;
}) {
  const [aktif, setAktif] = useState(0);
  const [detail, setDetail] = useState<{ skill: Skill; group: SkillGroup } | null>(null);
  const idDasar = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pemicuRef = useRef<HTMLButtonElement>(null);
  const tutupDetail = useCallback(() => setDetail(null), []);
  const Judul = halaman ? "h1" : "h2";
  const JudulKategori = halaman ? "h2" : "h3";

  // Satu kategori tidak memerlukan tab — ia hanya menambah kontrol yang tidak
  // mengubah apa pun.
  const pakaiTab = groups.length > 1;

  function keTab(index: number) {
    const tujuan = (index + groups.length) % groups.length;
    setAktif(tujuan);
    tabRefs.current[tujuan]?.focus();
  }

  return (
    <section
      id={halaman ? undefined : "keahlian"}
      aria-labelledby={`${idDasar}-judul`}
      className={halaman ? undefined : "scroll-mt-28 border-t border-border-subtle py-12 sm:scroll-mt-20 sm:py-16"}
    >
      <div className="rounded-card-lg border border-border-subtle bg-surface-raised/55 shadow-card">
        <div className="flex flex-col gap-6 rounded-t-card-lg border-b border-border-subtle bg-accent-soft/50 p-5 sm:p-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            {halaman ? (
              <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-accent">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Kembali ke beranda
              </Link>
            ) : null}
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
              {intro?.eyebrow?.trim() || "Alat & teknologi"}
            </p>
            <Judul id={`${idDasar}-judul`} className="font-heading text-3xl font-bold text-text sm:text-4xl lg:text-5xl">
              {intro?.headline?.trim() || "Keahlian"}
            </Judul>
            <p className="prosa mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
              {intro?.description?.trim() || "Jelajahi alat yang saya gunakan berdasarkan kategori. Buka kartu untuk melihat detailnya."}
            </p>
            {!halaman ? (
              <Link href="/keahlian" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Lihat semua
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
          </div>

          {pakaiTab ? (
            <div
              role="tablist"
              aria-label="Kelompok keahlian"
              className="flex w-fit max-w-full flex-wrap gap-1 rounded-card border border-border-subtle bg-surface-sunken p-1.5 xl:max-w-[55%]"
            >
              {groups.map((group, index) => (
                <button
                  key={group.id}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  type="button"
                  role="tab"
                  id={`${idDasar}-tab-${index}`}
                  aria-controls={`${idDasar}-panel-${index}`}
                  aria-selected={index === aktif}
                  tabIndex={index === aktif ? 0 : -1}
                  onClick={() => setAktif(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                      event.preventDefault();
                      keTab(index + (event.key === "ArrowRight" ? 1 : -1));
                    }
                  }}
                  className={cn(
                    "min-h-10 max-w-full rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    index === aktif
                      ? "bg-accent text-accent-contrast"
                      : "text-text-muted hover:bg-surface-raised hover:text-accent",
                  )}
                >
                  {group.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-8">
          {groups.length === 0 ? (
            <EmptyState title="Belum ada keahlian" description="Keahlian yang diterbitkan akan tampil di sini." />
          ) : groups.map((group, index) => (
            <div
              key={group.id}
              id={`${idDasar}-panel-${index}`}
              role={pakaiTab ? "tabpanel" : undefined}
              aria-labelledby={pakaiTab ? `${idDasar}-tab-${index}` : undefined}
              hidden={pakaiTab && index !== aktif}
              tabIndex={pakaiTab ? 0 : undefined}
            >
              <KelompokKeahlian
                group={group}
                Judul={JudulKategori}
                onDetail={(skill, pemicu) => {
                  pemicuRef.current = pemicu;
                  setDetail({ skill, group });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <Modal terbuka={detail !== null} onTutup={tutupDetail} judul={detail?.skill.name} label={detail?.group.name} pemicuRef={pemicuRef}>
        {detail ? <DetailKeahlian {...detail} /> : null}
      </Modal>
    </section>
  );
}

function KelompokKeahlian({
  group,
  Judul,
  onDetail,
}: {
  group: SkillGroup;
  Judul: "h2" | "h3";
  onDetail: (skill: Skill, pemicu: HTMLButtonElement) => void;
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          {group.eyebrow ? (
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
              <Layers3 aria-hidden="true" className="size-4 shrink-0" />
              {group.eyebrow}
            </p>
          ) : null}
          <Judul className="mt-1 font-heading text-2xl font-bold text-text sm:text-3xl">
            {group.name}
          </Judul>
        </div>

        {group.description ? (
          <p className="prosa text-sm leading-relaxed text-text-muted lg:max-w-md">
            {group.description}
          </p>
        ) : null}
      </div>

      <ul className="mt-6 grid list-none gap-3 min-[380px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {group.skills.map((skill) => (
          <li
            key={skill.id}
            className="group relative flex min-w-0 flex-col items-start rounded-card border border-border-subtle bg-surface-raised p-4 shadow-card transition-shadow hover:shadow-card-hover sm:p-5"
          >
            <LogoKeahlian logoUrl={skill.logo_url} nama={skill.name} />

            <p className="mt-5 font-heading text-base font-bold text-text sm:text-lg">
              {skill.name}
            </p>

            {/* Baris keterangan hanya dirender kalau salah satu nilainya ada —
                bukan sebagai "Sejak — · —" yang tidak memberi informasi. */}
            {skill.since_year || skill.level ? (
              <p className="mt-1 text-sm text-text-muted">
                {[
                  skill.since_year ? `Sejak ${skill.since_year}` : null,
                  skill.level ? LABEL_TINGKAT[skill.level] ?? skill.level : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}

            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => onDetail(skill, event.currentTarget)}
              className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-accent after:absolute after:inset-0 after:rounded-card group-hover:underline"
            >
              Lihat detail<span className="sr-only"> {skill.name}</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DetailKeahlian({ skill, group }: { skill: Skill; group: SkillGroup }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5 rounded-card border border-border-subtle bg-surface-sunken p-4">
        <LogoKeahlian logoUrl={skill.logo_url} nama={skill.name} />
        <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-text-muted">Kategori</dt>
            <dd className="font-semibold text-text">{group.name}</dd>
          </div>
          {skill.since_year ? (
            <div>
              <dt className="text-text-muted">Digunakan sejak</dt>
              <dd className="font-semibold text-text">{skill.since_year}</dd>
            </div>
          ) : null}
          {skill.level ? (
            <div>
              <dt className="text-text-muted">Tingkat</dt>
              <dd className="font-semibold text-text">{LABEL_TINGKAT[skill.level] ?? skill.level}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {group.description ? (
        <div>
          <p className="text-sm font-semibold text-text">Tentang kategori</p>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{group.description}</p>
        </div>
      ) : null}
    </div>
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
    "flex size-15 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-subtle sm:size-18";

  if (logoUrl) {
    return (
      <div className={cn(kelas, "bg-logo-background")}>
        <Image
          src={logoUrl}
          // Nama alatnya sudah tertulis tepat di bawah logo ini.
          alt=""
          width={72}
          height={72}
          className="size-full object-contain p-1.5"
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
      <span className="font-heading text-lg font-bold text-text-subtle">
        {inisial || "?"}
      </span>
    </div>
  );
}
