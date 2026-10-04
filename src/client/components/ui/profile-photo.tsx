import Image from "next/image";

import { cn } from "@/shared/cn";

/**
 * Foto profil dengan placeholder.
 *
 * Alt text selalu menyebut nama pemilik. Kalau URL foto belum ada, yang
 * dirender adalah placeholder berisi inisial — bukan gambar rusak, dan tata
 * letak tetap rapi karena ukurannya sama.
 */
export function ProfilePhoto({
  photoUrl,
  fullName,
  size,
  priority = false,
  className,
}: {
  photoUrl: string | null;
  fullName: string;
  /**
   * Ukuran intrinsik gambar dalam piksel — bahan next/image untuk memilih
   * resolusi yang diunduh. Ukuran TAMPILAN ditentukan `className`, bukan ini.
   *
   * Isi dengan ukuran terbesar yang mungkin dipakai di layar lebar, supaya
   * gambarnya tidak pecah di sana.
   */
  size: number;
  priority?: boolean;
  className?: string;
}) {
  const kelas = cn(
    "rounded-card-lg border border-border-subtle bg-surface-sunken object-cover",
    className,
  );

  if (!photoUrl) {
    const inisial = fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((bagian) => bagian[0]?.toUpperCase() ?? "")
      .join("");

    // Ukurannya ikut `className` saja, TIDAK lewat style inline berisi `size`.
    // Style inline mengalahkan setiap class responsif, sehingga placeholder
    // akan tetap sebesar ukuran intrinsiknya di layar kecil dan mendorong
    // halaman melebar. Jalur <Image> di bawah sudah berperilaku begitu —
    // width/height di sana hanya petunjuk rasio, bukan ukuran tampilan.
    return (
      <div
        role="img"
        aria-label={`Placeholder foto profil ${fullName}`}
        className={cn(kelas, "flex items-center justify-center")}
      >
        <span className="font-heading text-3xl font-bold text-text-subtle">
          {inisial || "?"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={`Foto profil ${fullName}`}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={kelas}
    />
  );
}
