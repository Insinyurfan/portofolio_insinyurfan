"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button, Input } from "@/client/components/admin/ui";

/**
 * Menyunting daftar teks sebagai daftar yang benar-benar bisa ditambah,
 * dihapus, dan diurutkan — bukan satu field teks yang dipisah koma.
 *
 * Dipakai untuk tech stack proyek dan daftar role di profil.
 */
export function StringListField({
  label,
  nilai,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  nilai: string[];
  onChange: (nilai: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [baru, setBaru] = useState("");

  function tambah() {
    const bersih = baru.trim();
    if (bersih === "") return;
    onChange([...nilai, bersih]);
    setBaru("");
  }

  function pindah(index: number, arah: -1 | 1) {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= nilai.length) return;
    const salinan = [...nilai];
    const a = salinan[index];
    const b = salinan[tujuan];
    if (a === undefined || b === undefined) return;
    salinan[index] = b;
    salinan[tujuan] = a;
    onChange(salinan);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-adm-fg">{label}</p>

      {nilai.length > 0 ? (
        <ul className="space-y-1.5">
          {nilai.map((item, index) => (
            <li
              key={`${index}-${item}`}
              className="flex items-center gap-2 rounded-adm border border-adm-border bg-adm-panel px-2 py-1.5"
            >
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={() => pindah(index, -1)}
                  aria-label={`Pindahkan ${item} ke atas`}
                >
                  <ChevronUp aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === nilai.length - 1}
                  onClick={() => pindah(index, 1)}
                  aria-label={`Pindahkan ${item} ke bawah`}
                >
                  <ChevronDown aria-hidden="true" />
                </Button>
              </div>

              <span className="min-w-0 flex-1 truncate text-sm text-adm-fg">
                {item}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-adm-danger hover:bg-adm-danger-soft"
                onClick={() => onChange(nilai.filter((_, i) => i !== index))}
                aria-label={`Hapus ${item}`}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={baru}
          onChange={(e) => setBaru(e.target.value)}
          placeholder={placeholder}
          aria-label={`Tambah ${label}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter menambah item, bukan mengirim form.
              e.preventDefault();
              tambah();
            }
          }}
        />
        <Button variant="outline" onClick={tambah}>
          <Plus aria-hidden="true" />
          Tambah
        </Button>
      </div>

      {hint ? <p className="text-xs text-adm-fg-subtle">{hint}</p> : null}
    </div>
  );
}
