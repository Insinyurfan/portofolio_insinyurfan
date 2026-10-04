"use client";

import { Mail, MailOpen, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/client/components/admin/confirm-dialog";
import { Badge, Button, EmptyState } from "@/client/components/admin/ui";
import { useAksi } from "@/client/components/admin/use-aksi";
import { hapusItemAction, tandaiPesanAction } from "@/server/actions/konten";
import { cn } from "@/shared/cn";
import type { Message } from "@/shared/types";

const WAKTU = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Inbox pesan.
 *
 * Isi pesan berasal dari pengunjung — satu-satunya data di sistem ini yang
 * kelak datang dari orang luar. Karena itu nama, subjek, dan isinya SELALU
 * dirender sebagai teks biasa, tidak pernah sebagai markup, dan alamat web di
 * dalamnya tidak dijadikan tautan yang bisa diklik.
 */
export function MessagesManager({ items }: { items: Message[] }) {
  const { jalankan, sedangBerjalan } = useAksi();
  const [dibuka, setDibuka] = useState<string | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<Message | null>(null);

  async function buka(pesan: Message) {
    const sudahTerbuka = dibuka === pesan.id;
    setDibuka(sudahTerbuka ? null : pesan.id);

    // Membuka pesan yang belum dibaca menandainya sudah dibaca.
    // Pesan yang sudah dibaca tidak diubah statusnya saat dibuka ulang.
    if (!sudahTerbuka && !pesan.is_read) {
      await jalankan(() => tandaiPesanAction({ id: pesan.id, is_read: true }));
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada pesan"
        description="Pesan dari pengunjung akan muncul di sini setelah form kontak publik dibuat di change berikutnya."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((pesan) => {
          const terbuka = dibuka === pesan.id;

          return (
            <li
              key={pesan.id}
              className={cn(
                "rounded-adm border bg-adm-panel",
                // Pesan belum dibaca dibedakan lewat border tebal + badge,
                // bukan hanya lewat warna.
                pesan.is_read
                  ? "border-adm-border"
                  : "border-l-4 border-adm-border border-l-adm-primary",
              )}
            >
              <div className="flex flex-wrap items-start gap-3 p-3">
                <button
                  type="button"
                  onClick={() => buka(pesan)}
                  aria-expanded={terbuka}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ring"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-adm-fg">
                      {pesan.sender_name}
                    </span>
                    {pesan.is_read ? (
                      <Badge>Sudah dibaca</Badge>
                    ) : (
                      <Badge tone="warning">Belum dibaca</Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-adm-fg-muted">
                    {pesan.subject ?? "(tanpa subjek)"} — {pesan.sender_email}
                  </span>
                  <span className="mt-0.5 block text-xs text-adm-fg-subtle">
                    {WAKTU.format(new Date(pesan.created_at))}
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={sedangBerjalan}
                    onClick={() =>
                      jalankan(() =>
                        tandaiPesanAction({
                          id: pesan.id,
                          is_read: !pesan.is_read,
                        }),
                      )
                    }
                    aria-label={
                      pesan.is_read
                        ? `Tandai pesan dari ${pesan.sender_name} belum dibaca`
                        : `Tandai pesan dari ${pesan.sender_name} sudah dibaca`
                    }
                  >
                    {pesan.is_read ? (
                      <Mail aria-hidden="true" />
                    ) : (
                      <MailOpen aria-hidden="true" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-adm-danger hover:bg-adm-danger-soft"
                    onClick={() => setAkanDihapus(pesan)}
                    aria-label={`Hapus pesan dari ${pesan.sender_name}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {terbuka ? (
                <div className="border-t border-adm-border px-3 py-3">
                  {/* whitespace-pre-line menjaga baris baru sebagaimana
                      dikirim, tanpa pernah menafsirkan isinya sebagai HTML. */}
                  <p className="whitespace-pre-line text-sm text-adm-fg">
                    {pesan.body}
                  </p>
                  <a
                    href={`mailto:${pesan.sender_email}`}
                    className="mt-3 inline-block text-sm font-medium text-adm-primary underline-offset-2 hover:underline"
                  >
                    Balas lewat email →
                  </a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        terbuka={akanDihapus !== null}
        judul="Hapus pesan ini?"
        keterangan={
          akanDihapus
            ? `Pesan dari ${akanDihapus.sender_name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        sedangBerjalan={sedangBerjalan}
        onBatal={() => setAkanDihapus(null)}
        onKonfirmasi={async () => {
          if (!akanDihapus) return;
          const ok = await jalankan(() =>
            hapusItemAction({ tabel: "messages", id: akanDihapus.id }),
          );
          if (ok) setAkanDihapus(null);
        }}
      />
    </>
  );
}
