import { ExperienceFilter } from "@/client/components/experience/experience-filter";
import { ExperienceTimeline } from "@/client/components/experience/experience-timeline";
import { EmptyState } from "@/client/components/ui/primitives";
import type { Experience, ExperienceType } from "@/shared/types";

/**
 * Filter beserta daftarnya, dipakai bersama oleh `/pengalaman` dan setiap
 * `/pengalaman/jenis/[jenis]`.
 *
 * Dikumpulkan jadi satu komponen supaya kedua halaman tidak bisa menyimpang:
 * menambahkan sesuatu ke daftar hanya perlu disunting di sini, bukan di dua
 * berkas yang mudah tertinggal salah satunya.
 */
export function ExperienceSection({
  semua,
  terfilter,
  aktif,
}: {
  /** Seluruh entri terbit; dipakai menyusun pilihan filter. */
  semua: Experience[];
  /** Entri yang ditampilkan setelah disaring. */
  terfilter: Experience[];
  aktif: ExperienceType | null;
}) {
  // Pilihan filter dibangun dari data, bukan dari daftar yang ditulis di kode:
  // jenis yang belum pernah dipakai tidak ditawarkan, sehingga pengunjung tidak
  // pernah menemui halaman filter yang kosong.
  const urutan: ExperienceType[] = [
    "work",
    "internship",
    "organization",
    "freelance",
  ];
  const tersedia = urutan.filter((jenis) =>
    semua.some((item) => item.type === jenis),
  );

  return (
    <>
      <ExperienceFilter tersedia={tersedia} aktif={aktif} />

      {terfilter.length === 0 ? (
        <EmptyState
          title="Belum ada pengalaman"
          description={
            aktif === null
              ? "Tambahkan entri pengalaman lewat dashboard admin untuk menampilkannya di sini."
              : "Belum ada entri untuk jenis ini. Pilih “Semua” untuk melihat seluruh pengalaman."
          }
        />
      ) : (
        <ExperienceTimeline items={terfilter} />
      )}
    </>
  );
}
