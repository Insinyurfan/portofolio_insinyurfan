"use client";

import { useSyncExternalStore } from "react";

/** Tidak ada sumber eksternal yang berubah; langganannya memang kosong. */
const berlangganan = () => () => {};
const diKlien = () => true;
const diServer = () => false;

/**
 * `false` saat render di server dan saat hydration, `true` sesudahnya.
 *
 * Dipakai komponen yang keadaan awalnya hanya diketahui di peramban — tema
 * yang berlaku, misalnya.
 *
 * Mengapa `useSyncExternalStore` dan bukan `useState` + `useEffect`:
 *   1. React memakai `getServerSnapshot` selama hydration, sehingga render
 *      pertama di klien PERSIS sama dengan HTML dari server. Tanpa ini,
 *      komponen tema merender `<span>` di server tetapi `<button>` di klien,
 *      dan React melaporkan hydration mismatch.
 *   2. Menyetel state di dalam effect memicu render berantai, dan aturan lint
 *      `react-hooks/set-state-in-effect` menolaknya.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(berlangganan, diKlien, diServer);
}
