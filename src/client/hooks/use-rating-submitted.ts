"use client";

import { useSyncExternalStore } from "react";

const KUNCI = "portofolio:rating-terkirim";

const pelanggan = new Set<() => void>();

function beritahuSemua() {
  for (const cb of pelanggan) cb();
}

function subscribe(onStoreChange: () => void): () => void {
  pelanggan.add(onStoreChange);
  // Tab lain yang mengirim rating ikut tercermin di tab ini.
  window.addEventListener("storage", onStoreChange);

  return () => {
    pelanggan.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(KUNCI) === "1";
  } catch {
    // Penyimpanan peramban diblokir: form tetap dirender normal.
    return false;
  }
}

/**
 * Di server dan selama hydration selalu `false`.
 *
 * Ini bukan detail kecil: beranda di-cache ISR, jadi kalau keadaan "sudah
 * mengirim" ikut dirender di server, halaman yang di-cache akan menampilkan
 * ucapan terima kasih kepada SEMUA pengunjung dan form ratingnya hilang.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Apakah peramban ini sudah pernah mengirim rating.
 *
 * Memakai `useSyncExternalStore`, bukan `useState` + `useEffect`: React
 * memakai `getServerSnapshot` selama hydration sehingga render pertama di
 * klien persis sama dengan HTML dari server, dan tidak ada setState di dalam
 * effect yang memicu render berantai.
 *
 * Penanda ini KENYAMANAN, bukan pembatas akses — ia hanya mencegah pengiriman
 * ganda yang tidak disengaja. Yang benar-benar menjaga adalah pembatasan laju
 * di database dan moderasi admin.
 */
export function useSudahMemberiRating(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Menandai peramban ini sudah mengirim rating. */
export function tandaiSudahMemberiRating(): void {
  try {
    window.localStorage.setItem(KUNCI, "1");
  } catch {
    // Gagal menyimpan penanda tidak mengubah apa pun yang penting.
  }
  beritahuSemua();
}
