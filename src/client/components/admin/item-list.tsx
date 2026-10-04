"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { ConfirmDialog } from "@/client/components/admin/confirm-dialog";
import { Badge, Button, EmptyState } from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import {
  hapusItemAction,
  toggleTerbitAction,
  urutkanAction,
} from "@/server/actions/konten";
import { cn } from "@/shared/cn";

type TabelUrut =
  | "social_links"
  | "education"
  | "skill_categories"
  | "skills"
  | "experiences"
  | "projects"
  | "achievements";

export type ItemDaftar = {
  id: string;
  judul: string;
  keterangan?: string;
  is_published: boolean;
  /** Ditampilkan di sisi kanan judul, misalnya badge tipe atau featured. */
  penanda?: React.ReactNode;
};

/**
 * Daftar pengelolaan yang dipakai semua jenis konten.
 *
 * Menyediakan: penanda status terbit, toggle terbit, tombol naik/turun,
 * sunting, hapus dengan konfirmasi, dan empty state.
 *
 * Catatan aksesibilitas: setelah item berpindah, fokus sengaja DIPERTAHANKAN
 * pada tombol yang sama, supaya pemindahan berulang bisa dilakukan tanpa
 * mencari ulang posisinya.
 */
export function ItemList({
  tabel,
  items,
  onSunting,
  labelHapus,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  tabel: TabelUrut;
  items: ItemDaftar[];
  onSunting: (id: string) => void;
  /** Akibat turunan yang harus disebut di dialog konfirmasi. */
  labelHapus?: (item: ItemDaftar) => string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [akanDihapus, setAkanDihapus] = useState<ItemDaftar | null>(null);
  const fokusTerakhir = useRef<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  async function pindah(id: string, arah: -1 | 1, tombolKey: string) {
    fokusTerakhir.current = tombolKey;
    await jalankan(() => urutkanAction({ tabel, id, arah }));
    // Setelah router.refresh(), elemen dirender ulang; kembalikan fokus ke
    // tombol dengan peran yang sama pada item yang baru dipindahkan.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-tombol="${tombolKey}"]`,
      );
      el?.focus();
    });
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const pertama = index === 0;
          const terakhir = index === items.length - 1;

          return (
            <li
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-adm border bg-adm-panel p-3",
                item.is_published
                  ? "border-adm-border"
                  : "border-dashed border-adm-border-strong",
              )}
            >
              {/* Tombol urut */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  data-tombol={`naik-${item.id}`}
                  disabled={pertama || sedangBerjalan}
                  onClick={() => pindah(item.id, -1, `naik-${item.id}`)}
                  aria-label={`Pindahkan ${item.judul} ke atas`}
                >
                  <ChevronUp aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  data-tombol={`turun-${item.id}`}
                  disabled={terakhir || sedangBerjalan}
                  onClick={() => pindah(item.id, 1, `turun-${item.id}`)}
                  aria-label={`Pindahkan ${item.judul} ke bawah`}
                >
                  <ChevronDown aria-hidden="true" />
                </Button>
              </div>

              {/* Judul dan keterangan */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-adm-fg">{item.judul}</p>
                  {item.penanda}
                  {/* Status terbit terbaca tanpa perlu membuka formnya, dan
                      tidak hanya bergantung pada warna. */}
                  {item.is_published ? (
                    <Badge tone="success">Terbit</Badge>
                  ) : (
                    <Badge tone="warning">Tersembunyi</Badge>
                  )}
                </div>
                {item.keterangan ? (
                  <p className="mt-0.5 truncate text-sm text-adm-fg-muted">
                    {item.keterangan}
                  </p>
                ) : null}
              </div>

              {/* Aksi */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={sedangBerjalan}
                  onClick={() =>
                    jalankan(() =>
                      toggleTerbitAction({
                        tabel,
                        id: item.id,
                        is_published: !item.is_published,
                      }),
                    )
                  }
                  aria-label={
                    item.is_published
                      ? `Sembunyikan ${item.judul}`
                      : `Terbitkan ${item.judul}`
                  }
                >
                  {item.is_published ? (
                    <Eye aria-hidden="true" />
                  ) : (
                    <EyeOff aria-hidden="true" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSunting(item.id)}
                  aria-label={`Sunting ${item.judul}`}
                >
                  <Pencil aria-hidden="true" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-adm-danger hover:bg-adm-danger-soft"
                  onClick={() => setAkanDihapus(item)}
                  aria-label={`Hapus ${item.judul}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        terbuka={akanDihapus !== null}
        judul={`Hapus "${akanDihapus?.judul ?? ""}"?`}
        keterangan={
          akanDihapus
            ? (labelHapus?.(akanDihapus) ??
              "Item ini akan dihapus permanen dan langsung hilang dari halaman publik. Tindakan ini tidak dapat dibatalkan.")
            : ""
        }
        sedangBerjalan={sedangBerjalan}
        onBatal={() => setAkanDihapus(null)}
        onKonfirmasi={async () => {
          if (!akanDihapus) return;
          const berhasil = await jalankan(() =>
            hapusItemAction({ tabel, id: akanDihapus.id }),
          );
          if (berhasil) setAkanDihapus(null);
        }}
      />
    </>
  );
}
