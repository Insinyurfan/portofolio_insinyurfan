"use client";

/**
 * Mengubah gambar menjadi WebP di PERAMBAN, sebelum diunggah.
 *
 * Dikerjakan di sisi klien, bukan server, karena dua alasan: tidak perlu
 * menambah dependensi pengolah gambar di server, dan yang dikirim lewat
 * jaringan sudah berukuran kecil — foto 4 MB dari kamera ponsel tidak perlu
 * diunggah utuh hanya untuk dikecilkan setelah sampai.
 *
 * Kalau apa pun gagal, berkas ASLI yang dipakai. Konversi ini penghematan,
 * bukan syarat — pemilik tidak boleh kehilangan kemampuan mengunggah gambar
 * hanya karena peramban tertentu tidak mendukung sesuatu di sini.
 */

/** Sisi terpanjang maksimum setelah konversi. */
const SISI_MAKS = 1600;

/**
 * Mutu WebP. 0,82 adalah titik yang sulit dibedakan mata dari aslinya pada
 * foto maupun logo, sementara ukurannya turun jauh.
 */
const MUTU = 0.82;

/**
 * Tipe yang DIKONVERSI. Sengaja hanya dua.
 *
 *   - SVG tidak ikut: formatnya vektor, jadi mengubahnya ke WebP justru
 *     membuatnya kehilangan ketajaman di segala ukuran dan sering malah
 *     memperbesar berkas.
 *   - GIF tidak ikut: bisa beranimasi, dan canvas hanya menyalin bingkai
 *     pertama — animasinya akan hilang tanpa pemberitahuan.
 *   - WebP dan AVIF tidak ikut: keduanya sudah efisien. Mengode ulang hanya
 *     menurunkan mutu tanpa menghemat; AVIF biasanya malah lebih kecil dari
 *     WebP.
 */
const BISA_DIKONVERSI = new Set(["image/jpeg", "image/png"]);

/** Ukuran tujuan, mempertahankan rasio dan tidak pernah memperbesar. */
function ukuranTujuan(lebar: number, tinggi: number) {
  const sisiTerpanjang = Math.max(lebar, tinggi);
  if (sisiTerpanjang <= SISI_MAKS) return { lebar, tinggi };

  const skala = SISI_MAKS / sisiTerpanjang;
  return {
    lebar: Math.round(lebar * skala),
    tinggi: Math.round(tinggi * skala),
  };
}

export async function keWebp(file: File): Promise<File> {
  if (!BISA_DIKONVERSI.has(file.type)) return file;

  try {
    // createImageBitmap, bukan <img>: hanya cara ini yang menghormati
    // orientasi EXIF, sehingga foto dari ponsel tidak berubah menjadi miring
    // atau terbalik setelah dikonversi.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { lebar, tinggi } = ukuranTujuan(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = lebar;
    canvas.height = tinggi;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, lebar, tinggi);
    bitmap.close();

    const blob = await new Promise<Blob | null>((res) => {
      canvas.toBlob(res, "image/webp", MUTU);
    });

    // Peramban yang tidak dapat mengode WebP mengembalikan null, atau diam-diam
    // mengembalikan PNG. Keduanya ditolak di sini.
    if (!blob || blob.type !== "image/webp") return file;

    // Hasil konversi hanya dipakai kalau benar-benar lebih kecil. Pada PNG
    // kecil berwarna sedikit, WebP bisa justru lebih besar — dan mengunggah
    // berkas yang lebih besar demi "penghematan" jelas tidak masuk akal.
    if (blob.size >= file.size) return file;

    const namaDasar = file.name.replace(/\.[^.]+$/, "") || "gambar";
    return new File([blob], `${namaDasar}.webp`, { type: "image/webp" });
  } catch {
    // Format yang tidak dapat didekode, gambar terlalu besar untuk canvas,
    // atau API yang tidak tersedia. Berkas aslinya tetap dapat diunggah.
    return file;
  }
}
