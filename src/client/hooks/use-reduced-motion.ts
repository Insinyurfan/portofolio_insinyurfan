"use client";

import { useSyncExternalStore } from "react";

const KUERI = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void): () => void {
  const kueri = window.matchMedia(KUERI);
  kueri.addEventListener("change", onStoreChange);
  return () => kueri.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(KUERI).matches;
}

/**
 * Di server, anggap gerak dikurangi. Konsekuensinya HTML yang dikirim selalu
 * berupa keadaan statis dan lengkap — jadi pengunjung tanpa JavaScript melihat
 * seluruh konten, bukan animasi yang tidak pernah jalan.
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Berlangganan preferensi `prefers-reduced-motion` lewat useSyncExternalStore,
 * bukan setState di dalam effect — media query adalah sumber eksternal, dan
 * inilah cara React membacanya tanpa memicu render berantai.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
