import "server-only";

import { Resend } from "resend";

import { adminEmail, konfigurasiEmail } from "@/lib/env";

/**
 * Notifikasi email ke admin saat ada pesan baru.
 *
 * Dua jaminan yang dipegang modul ini:
 *
 *   1. Kegagalan di sini TIDAK PERNAH sampai ke pengunjung. Pesannya sudah
 *      tersimpan di database sebelum fungsi ini dipanggil, dan hitungan "pesan
 *      belum dibaca" di dashboard tetap menjadi sumber kebenaran — jadi pesan
 *      tidak pernah benar-benar terlewat walau emailnya gagal.
 *   2. Nilai dari pengunjung tidak pernah menjadi baris header email selain
 *      Reply-To yang sudah divalidasi sebagai alamat email.
 */

const BATAS_WAKTU_MS = 5000;

/** Dicatat sekali saja, supaya log tidak dibanjiri pesan yang sama. */
let sudahMemberiTahuTanpaKonfigurasi = false;

/**
 * Membersihkan nilai yang akan masuk ke baris header email.
 *
 * Karakter baris baru adalah pemisah header di SMTP. Nilai yang memuatnya
 * dapat menyisipkan header tambahan — misalnya `Bcc:` — kalau diteruskan apa
 * adanya. Resend memakai API HTTP, bukan SMTP mentah, tetapi pembersihan ini
 * tetap dilakukan supaya kebenarannya tidak bergantung pada detail pustaka.
 */
// Dibangun dari string, bukan literal regex: U+2028 dan U+2029 adalah
// pemisah baris yang tidak boleh muncul mentah di kode sumber JavaScript.
const PEMISAH_BARIS = new RegExp("[\r\n\u2028\u2029]+", "g");

function bersihkanUntukHeader(nilai: string): string {
  return nilai.replace(PEMISAH_BARIS, " ").trim().slice(0, 200);
}

/** Alamat email yang sah, atau null. Hanya ini yang boleh jadi Reply-To. */
function emailSahAtauNull(nilai: string): string | null {
  const bersih = bersihkanUntukHeader(nilai);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bersih) ? bersih : null;
}

/** Teks untuk badan email. Tidak pernah dirender sebagai HTML. */
function keTeks(nilai: string | null): string {
  return (nilai ?? "").replace(/\r\n/g, "\n");
}

const WAKTU = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export async function kirimNotifikasiPesan(pesan: {
  nama: string;
  email: string;
  subjek: string | null;
  isi: string;
}): Promise<void> {
  const konfigurasi = konfigurasiEmail();

  if (!konfigurasi) {
    // Ketidakhadiran konfigurasi adalah KETERANGAN, bukan kegagalan: form
    // kontak memang harus tetap berfungsi penuh tanpanya.
    if (!sudahMemberiTahuTanpaKonfigurasi) {
      console.info(
        "[email] RESEND_API_KEY / RESEND_FROM_EMAIL belum disetel — notifikasi email dilewati. Pesan tetap masuk ke dashboard.",
      );
      sudahMemberiTahuTanpaKonfigurasi = true;
    }
    return;
  }

  const namaBersih = bersihkanUntukHeader(pesan.nama);
  const subjekBersih = pesan.subjek ? bersihkanUntukHeader(pesan.subjek) : null;
  const replyTo = emailSahAtauNull(pesan.email);

  // Subjek email disusun dari nilai yang sudah dibersihkan dari baris baru.
  const subjekEmail = subjekBersih
    ? `[Portofolio] ${subjekBersih}`
    : `[Portofolio] Pesan baru dari ${namaBersih}`;

  // Badan email sengaja TEKS, bukan HTML: isi pesan datang dari orang luar,
  // dan teks biasa tidak punya cara untuk dieksekusi.
  const badan = [
    "Pesan baru dari form kontak portofolio.",
    "",
    `Nama    : ${keTeks(namaBersih)}`,
    `Email   : ${keTeks(pesan.email)}`,
    `Subjek  : ${subjekBersih ? keTeks(subjekBersih) : "(tanpa subjek)"}`,
    `Masuk   : ${WAKTU.format(new Date())}`,
    "",
    "Isi pesan:",
    "----------------------------------------",
    keTeks(pesan.isi),
    "----------------------------------------",
    "",
    "Balas email ini untuk menjawab langsung ke pengirim.",
  ].join("\n");

  try {
    const resend = new Resend(konfigurasi.apiKey);

    // Batas waktu dibutuhkan: layanan email yang lambat tidak boleh menahan
    // konfirmasi yang dilihat pengunjung.
    const hasil = await Promise.race([
      resend.emails.send({
        from: konfigurasi.from,
        to: adminEmail(),
        subject: subjekEmail,
        text: badan,
        // Reply-To hanya disetel kalau alamatnya memang alamat email yang sah.
        ...(replyTo ? { replyTo } : {}),
      }),
      new Promise<never>((_, tolak) =>
        setTimeout(
          () => tolak(new Error(`batas waktu ${BATAS_WAKTU_MS} ms terlampaui`)),
          BATAS_WAKTU_MS,
        ),
      ),
    ]);

    // Resend TIDAK melempar error saat API menolak permintaan — ia
    // mengembalikan { data: null, error }. Tanpa pemeriksaan ini, kunci API
    // yang salah atau domain pengirim yang belum terverifikasi akan gagal
    // tanpa meninggalkan jejak apa pun di log.
    if (hasil.error) {
      console.error(
        "[email] notifikasi ditolak layanan:",
        hasil.error.name,
        hasil.error.message,
      );
      return;
    }
  } catch (error) {
    // Dicatat supaya bisa ditelusuri; TIDAK dilemparkan, karena pesannya
    // sendiri sudah tersimpan dengan benar.
    console.error(
      "[email] notifikasi gagal dikirim:",
      error instanceof Error ? error.message : error,
    );
  }
}
