"use client";

import { Check, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge, Button, EmptyState } from "@/components/admin/ui";
import { useAksi } from "@/components/admin/use-aksi";
import { hapusItemAction, moderasiRatingAction } from "@/app/admin/actions-content";
import { cn } from "@/lib/cn";
import type { Rating } from "@/lib/types";

const WAKTU = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Bintang sebagai ikon, nilainya juga tersedia sebagai teks. */
function Bintang({ jumlah }: { jumlah: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span aria-hidden="true" className="text-adm-warning-fg">
        {"★".repeat(jumlah)}
        <span className="text-adm-fg-subtle">{"★".repeat(5 - jumlah)}</span>
      </span>
      <span className="sr-only">{jumlah} dari 5 bintang</span>
    </span>
  );
}

/**
 * Moderasi rating.
 *
 * Rating yang menunggu persetujuan ditempatkan lebih dulu oleh query.
 * Nama dan komentar berasal dari pengunjung, jadi dirender sebagai teks biasa.
 */
export function RatingsManager({ items }: { items: Rating[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [akanDihapus, setAkanDihapus] = useState<Rating | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada rating"
        description="Rating dari pengunjung akan muncul di sini setelah form rating publik dibuat di change berikutnya."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((r) => (
          <li
            key={r.id}
            className={cn(
              "rounded-adm border bg-adm-panel p-3",
              r.is_approved
                ? "border-adm-border"
                : "border-l-4 border-adm-border border-l-adm-warning-fg",
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-adm-fg">{r.reviewer_name}</span>
                  <Bintang jumlah={r.stars} />
                  {r.is_approved ? (
                    <Badge tone="success">Disetujui</Badge>
                  ) : (
                    <Badge tone="warning">Menunggu persetujuan</Badge>
                  )}
                </div>

                {r.comment ? (
                  <p className="mt-1.5 whitespace-pre-line text-sm text-adm-fg-muted">
                    {r.comment}
                  </p>
                ) : null}

                <p className="mt-1 text-xs text-adm-fg-subtle">
                  {WAKTU.format(new Date(r.created_at))}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant={r.is_approved ? "ghost" : "primary"}
                  size="sm"
                  disabled={sedangBerjalan}
                  onClick={() =>
                    jalankan(() =>
                      moderasiRatingAction({
                        id: r.id,
                        is_approved: !r.is_approved,
                      }),
                    )
                  }
                >
                  {r.is_approved ? (
                    <>
                      <Undo2 aria-hidden="true" />
                      Cabut
                    </>
                  ) : (
                    <>
                      <Check aria-hidden="true" />
                      Setujui
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-adm-danger hover:bg-adm-danger-soft"
                  onClick={() => setAkanDihapus(r)}
                  aria-label={`Hapus rating dari ${r.reviewer_name}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        terbuka={akanDihapus !== null}
        judul="Hapus rating ini?"
        keterangan={
          akanDihapus
            ? `Rating dari ${akanDihapus.reviewer_name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        sedangBerjalan={sedangBerjalan}
        onBatal={() => setAkanDihapus(null)}
        onKonfirmasi={async () => {
          if (!akanDihapus) return;
          const ok = await jalankan(() =>
            hapusItemAction({ tabel: "ratings", id: akanDihapus.id }),
          );
          if (ok) setAkanDihapus(null);
        }}
      />
    </>
  );
}
