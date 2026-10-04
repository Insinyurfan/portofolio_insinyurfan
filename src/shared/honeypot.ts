/**
 * Konstanta jalur tulis publik yang dipakai KEDUA sisi.
 *
 * Sengaja terpisah dari `src/server/actions/public.ts`: modul itu ditandai
 * `server-only` dan menyeret `next/headers`. Ketika komponen klien seperti
 * field honeypot mengimpor konstanta dari sana, seluruh rantai itu ikut
 * ditarik ke bundel peramban dan build gagal.
 */

/**
 * Nama field honeypot.
 *
 * Sengaja TIDAK menyerupai nama field yang umum (`email`, `url`, `phone`):
 * pengelola kata sandi dan pengisian otomatis peramban mengenali nama-nama
 * itu dan bisa mengisinya sendiri — yang berarti pesan pengunjung sungguhan
 * dibuang secara senyap.
 */
export const HONEYPOT_FIELD = "nomor_referensi";
