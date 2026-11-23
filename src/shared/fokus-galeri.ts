import type { CSSProperties } from "react";
import type { Json } from "@/shared/database.types";

export type FokusFoto = { x: number; y: number };
export type FokusGaleri = Record<string, FokusFoto>;

export const FOKUS_TENGAH: FokusFoto = { x: 50, y: 50 };

export function bacaFokusGaleri(data: Json | undefined): FokusGaleri {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const fokus: Array<[string, FokusFoto]> = [];
  for (const [src, posisi] of Object.entries(data)) {
    if (!posisi || typeof posisi !== "object" || Array.isArray(posisi)) continue;
    const { x, y } = posisi;
    if (
      typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 100 &&
      typeof y === "number" && Number.isInteger(y) && y >= 0 && y <= 100
    ) {
      fokus.push([src, { x, y }]);
    }
  }
  return Object.fromEntries(fokus);
}

export function gayaFoto(fokus?: FokusFoto): CSSProperties {
  return fokus
    ? { objectFit: "cover", objectPosition: `${fokus.x}% ${fokus.y}%` }
    : { objectFit: "contain" };
}
