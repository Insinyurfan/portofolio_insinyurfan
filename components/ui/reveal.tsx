"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Animasi masuk saat scroll, tanpa pustaka animasi.
 *
 * Dua hal yang disengaja:
 *
 * 1. Keadaan tersembunyi hanya diterapkan SETELAH observer terpasang. Jadi HTML
 *    yang dikirim server selalu terlihat penuh, dan konten tidak pernah hilang
 *    kalau JavaScript tidak jalan.
 * 2. `prefers-reduced-motion` diperiksa sebelum menyembunyikan apa pun, jadi
 *    pengunjung yang meminta gerak dikurangi langsung melihat keadaan akhir.
 *
 * Lihat design.md → "Animasi ditulis sendiri dengan IntersectionObserver".
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Jeda dalam milidetik, untuk memberi kesan bertahap pada daftar. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [siapAnimasi, setSiapAnimasi] = useState(false);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (kurangiGerak || typeof IntersectionObserver === "undefined") {
      return;
    }

    const elemen = ref.current;
    if (!elemen) return;

    // Baru sekarang konten boleh disembunyikan: observer sudah siap
    // memunculkannya kembali.
    setSiapAnimasi(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTerlihat(true);
            // Sekali muncul, selesai — tidak berulang setiap kali di-scroll.
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(elemen);
    return () => observer.disconnect();
  }, []);

  return (
    <As
      ref={ref as never}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        siapAnimasi && !terlihat ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </As>
  );
}
