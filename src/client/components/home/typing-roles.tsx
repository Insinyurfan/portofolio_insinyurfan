"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/client/hooks/use-reduced-motion";

/**
 * Animasi ketik untuk daftar role di hero.
 *
 * Aksesibilitas ditangani dengan memisahkan dua lapisan:
 *   - rangkaian karakter yang berubah diberi aria-hidden
 *   - satu elemen tersembunyi secara visual memuat SELURUH role sebagai teks
 *
 * Dengan begitu pembaca layar mendapat daftar lengkapnya sekali, bukan
 * pengumuman per karakter, dan tanpa perlu aria-live.
 * Lihat design.md → "Animasi ketik aksesibel lewat pemisahan teks".
 *
 * Seluruh perubahan state terjadi di dalam callback setTimeout, bukan di badan
 * effect, supaya tidak memicu render berantai.
 */

const JEDA_KETIK = 70;
const JEDA_HAPUS = 35;
const JEDA_TAHAN = 1600;

export function TypingRoles({ roles }: { roles: string[] }) {
  const bersih = roles.map((role) => role.trim()).filter((role) => role !== "");

  const kurangiGerak = useReducedMotion();
  const [indeks, setIndeks] = useState(0);
  const [panjang, setPanjang] = useState(0);
  const [menghapus, setMenghapus] = useState(false);

  const jumlah = bersih.length;
  const berputar = !kurangiGerak && jumlah > 1;
  const sekarang = bersih[indeks] ?? "";

  useEffect(() => {
    if (!berputar) return;

    const panjangTarget = sekarang.length;

    let jeda: number;
    let lanjut: () => void;

    if (!menghapus && panjang < panjangTarget) {
      jeda = JEDA_KETIK;
      lanjut = () => setPanjang((p) => p + 1);
    } else if (!menghapus) {
      // Selesai mengetik: tahan sebentar sebelum mulai menghapus.
      jeda = JEDA_TAHAN;
      lanjut = () => setMenghapus(true);
    } else if (panjang > 0) {
      jeda = JEDA_HAPUS;
      lanjut = () => setPanjang((p) => p - 1);
    } else {
      // Habis terhapus: lanjut ke role berikutnya, berulang dari awal.
      jeda = JEDA_HAPUS;
      lanjut = () => {
        setMenghapus(false);
        setIndeks((i) => (i + 1) % jumlah);
      };
    }

    const timer = setTimeout(lanjut, jeda);
    return () => clearTimeout(timer);
  }, [berputar, jumlah, menghapus, panjang, sekarang]);

  if (jumlah === 0) return null;

  // Satu role saja, atau gerak dikurangi: tampilkan statis tanpa siklus.
  if (!berputar) {
    return (
      <p className="font-heading text-lg font-semibold text-accent sm:text-xl">
        {bersih.join(" · ")}
      </p>
    );
  }

  return (
    <p className="font-heading text-lg font-semibold text-accent sm:text-xl">
      {/* Daftar lengkap untuk teknologi bantu. */}
      <span className="sr-only">{bersih.join(", ")}</span>

      {/* Lapisan visual yang berubah — tidak dibacakan pembaca layar. */}
      <span aria-hidden="true" className="inline-flex min-h-[1.5em] items-center">
        {sekarang.slice(0, panjang)}
        <span className="ml-0.5 inline-block w-0.5 animate-pulse self-stretch bg-accent" />
      </span>
    </p>
  );
}
