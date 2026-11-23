import { SlidersHorizontal } from "lucide-react";

import { Select } from "@/client/components/admin/ui";
import { FOKUS_TENGAH, gayaFoto, type FokusFoto } from "@/shared/fokus-galeri";

export function PengaturanPosisiFoto({ src, nomor, fokus, onChange }: {
  src: string;
  nomor: number;
  fokus?: FokusFoto;
  onChange: (fokus?: FokusFoto) => void;
}) {
  return (
    <details className="rounded-adm">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-adm p-1.5 text-sm text-adm-fg hover:bg-adm-panel-muted [&::-webkit-details-marker]:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- Tautan galeri di admin dapat berasal dari penyedia eksternal. */}
        <img
          src={src}
          alt=""
          loading="lazy"
          style={gayaFoto(fokus)}
          className="aspect-16/10 w-14 rounded-adm bg-adm-panel-muted"
        />
        <span className="font-medium">Foto {nomor}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-adm-primary">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Atur posisi
        </span>
      </summary>

      <div className="grid gap-4 p-2 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- Pratinjau tautan galeri yang sama dengan thumbnail. */}
        <img
          src={src}
          alt={`Pratinjau foto ${nomor}`}
          loading="lazy"
          style={gayaFoto(fokus)}
          className="aspect-16/10 w-full overflow-hidden rounded-adm border border-adm-border bg-adm-panel-muted"
        />
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm font-medium text-adm-fg">
            <span>Tampilan foto</span>
            <Select
              value={fokus ? "bingkai" : "utuh"}
              onChange={(event) => onChange(event.target.value === "bingkai" ? FOKUS_TENGAH : undefined)}
            >
              <option value="utuh">Tampilkan utuh</option>
              <option value="bingkai">Isi bingkai</option>
            </Select>
          </label>
          {fokus ? (
            <div className="grid gap-2 sm:max-w-xs">
              <label className="block text-sm text-adm-fg">
                Posisi horizontal
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fokus.x}
                  onChange={(event) => onChange({ ...fokus, x: event.target.valueAsNumber })}
                  className="block w-full accent-adm-primary"
                />
                <span aria-hidden="true" className="flex justify-between text-xs text-adm-fg-muted">
                  <span>Kiri</span><span>Kanan</span>
                </span>
              </label>
              <label className="block text-sm text-adm-fg">
                Posisi vertikal
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fokus.y}
                  onChange={(event) => onChange({ ...fokus, y: event.target.valueAsNumber })}
                  className="block w-full accent-adm-primary"
                />
                <span aria-hidden="true" className="flex justify-between text-xs text-adm-fg-muted">
                  <span>Atas</span><span>Bawah</span>
                </span>
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}
