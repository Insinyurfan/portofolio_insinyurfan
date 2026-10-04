import { FolderKanban, Mail, Star } from "lucide-react";
import Link from "next/link";

import { Badge, EmptyState, PageHeader } from "@/client/components/admin/ui";
import { adminGetRingkasan } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function RingkasanPage() {
  const r = await adminGetRingkasan();

  const totalProyek = r.proyekTerbit + r.proyekDraf;
  const belumAdaKonten =
    totalProyek === 0 && r.pesanBelumDibaca === 0 && r.ratingMenunggu === 0;

  return (
    <>
      <PageHeader
        title="Ringkasan"
        description="Keadaan isi portofolio dan apa yang menunggu perhatian Anda."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KartuHitungan
          href="/admin/proyek"
          icon={<FolderKanban className="size-4" aria-hidden="true" />}
          label="Proyek"
          angka={totalProyek}
          // Terbit dan draf dipisah, karena admin melihat keduanya.
          rincian={
            totalProyek === 0 ? (
              <span className="text-adm-fg-subtle">Belum ada proyek</span>
            ) : (
              <span className="flex flex-wrap gap-1.5">
                <Badge tone="success">{r.proyekTerbit} terbit</Badge>
                {r.proyekDraf > 0 ? (
                  <Badge tone="warning">{r.proyekDraf} draf</Badge>
                ) : null}
              </span>
            )
          }
        />

        <KartuHitungan
          href="/admin/pesan"
          icon={<Mail className="size-4" aria-hidden="true" />}
          label="Pesan belum dibaca"
          angka={r.pesanBelumDibaca}
          rincian={
            r.pesanBelumDibaca === 0 ? (
              <span className="text-adm-fg-subtle">Tidak ada pesan baru</span>
            ) : (
              <Badge tone="warning">Perlu dibaca</Badge>
            )
          }
        />

        <KartuHitungan
          href="/admin/rating"
          icon={<Star className="size-4" aria-hidden="true" />}
          label="Rating menunggu persetujuan"
          angka={r.ratingMenunggu}
          rincian={
            r.ratingMenunggu === 0 ? (
              <span className="text-adm-fg-subtle">
                Tidak ada yang perlu ditinjau
              </span>
            ) : (
              <Badge tone="warning">Perlu ditinjau</Badge>
            )
          }
        />
      </div>

      {belumAdaKonten ? (
        <div className="mt-6">
          <EmptyState
            title="Portofolio Anda masih kosong"
            description="Mulai dari mengisi profil, lalu tambahkan proyek dan pengalaman. Semua yang Anda isi di sini langsung tampil di halaman publik."
            action={
              <Link
                href="/admin/profil"
                className="inline-flex h-10 items-center rounded-adm bg-adm-primary px-4 text-sm font-medium text-adm-primary-fg hover:bg-adm-primary-hover"
              >
                Isi profil dulu
              </Link>
            }
          />
        </div>
      ) : null}
    </>
  );
}

function KartuHitungan({
  href,
  icon,
  label,
  angka,
  rincian,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  angka: number;
  rincian: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-adm border border-adm-border bg-adm-panel p-4 transition-colors hover:border-adm-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ring"
    >
      <span className="flex items-center gap-2 text-sm text-adm-fg-muted">
        {icon}
        {label}
      </span>
      <p className="mt-2 text-3xl font-bold text-adm-fg">{angka}</p>
      <div className="mt-2 text-xs">{rincian}</div>
    </Link>
  );
}
