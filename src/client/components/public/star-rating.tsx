import { Star } from "lucide-react";

import { cn } from "@/shared/cn";

/**
 * Pembulatan rata-rata ditetapkan DI SATU TEMPAT.
 *
 * Teks dan jumlah bintang yang terisi memakai nilai yang sama persis. Dua
 * tempat yang membulatkan sendiri akan menampilkan angka dan bintang yang
 * tidak cocok, dan itu terlihat seperti bug.
 */
export function bulatkanRating(nilai: number): number {
  return Math.round(nilai * 10) / 10;
}

/** "4,5" — satu angka desimal, koma sebagai pemisah desimal. */
export function formatRating(nilai: number): string {
  return bulatkanRating(nilai).toFixed(1).replace(".", ",");
}

/**
 * Lima bintang, terisi menurut nilai.
 *
 * Ikonnya ber-aria-hidden; nilainya disediakan sebagai teks terpisah supaya
 * teknologi bantu mendengar angkanya, bukan lima kali kata "bintang".
 */
export function StarRating({
  nilai,
  ukuran = "md",
  label,
}: {
  nilai: number;
  ukuran?: "sm" | "md";
  /** Teks untuk teknologi bantu. Kalau kosong, dibuat dari nilainya. */
  label?: string;
}) {
  const dibulatkan = bulatkanRating(nilai);
  const kelas = ukuran === "sm" ? "size-3.5" : "size-5";

  return (
    <span className="inline-flex items-center gap-0.5">
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((posisi) => (
          <Star
            key={posisi}
            className={cn(
              kelas,
              // Bintang dianggap terisi bila nilainya mencapai setidaknya
              // setengah langkah menuju posisi itu — konsisten dengan angka
              // yang ditampilkan karena keduanya memakai nilai yang sama.
              dibulatkan >= posisi - 0.5
                ? "fill-accent text-accent"
                : "text-border-strong",
            )}
          />
        ))}
      </span>
      <span className="sr-only">
        {label ?? `${formatRating(nilai)} dari 5 bintang`}
      </span>
    </span>
  );
}
