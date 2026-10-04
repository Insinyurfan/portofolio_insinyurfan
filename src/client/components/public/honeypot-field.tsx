import type { RefObject } from "react";

import { HONEYPOT_FIELD } from "@/shared/honeypot";

/**
 * Field honeypot.
 *
 * Nilainya dibaca langsung dari DOM lewat ref saat form dikirim, BUKAN lewat
 * state react-hook-form.
 *
 * Itu bukan pilihan gaya. Dua versi sebelumnya tidak berfungsi sama sekali:
 *
 *   1. Versi pertama merender input tanpa registrasi apa pun, sehingga nilai
 *      yang terkirim selalu string kosong.
 *   2. Versi kedua mendaftarkannya ke react-hook-form, tetapi bot mengisi
 *      field dengan menyetel `element.value` langsung — dan react-hook-form
 *      menyimpan nilainya di state internal, bukan membaca DOM, jadi
 *      perubahan itu tetap tidak terlihat.
 *
 * Membaca DOM lewat ref menangkap keduanya: siapa pun yang mengisi field ini
 * dengan cara apa pun akan terdeteksi. Terungkap oleh pengujian e2e yang
 * mengisi input lewat DOM lalu melihat datanya tetap tersimpan.
 *
 * Tersembunyi dari pengunjung DAN dari pembaca layar, tidak dapat menerima
 * fokus keyboard, dan pengisian otomatis dimatikan.
 *
 * Beberapa keputusan di sini sengaja tidak sembarangan:
 *
 *   - Namanya `nomor_referensi`, bukan `email` atau `url`. Pengelola kata
 *     sandi dan pengisian otomatis peramban mengenali nama field yang umum;
 *     kalau honeypot memakai nama seperti itu, ia bisa terisi sendiri dan
 *     pesan pengunjung sungguhan dibuang secara senyap.
 *   - `autoComplete="off"` dan `tabIndex={-1}` memperkuat hal yang sama.
 *   - Disembunyikan dengan posisi di luar layar, bukan `display: none`.
 *     Sebagian bot melewati field yang `display: none`.
 *   - `aria-hidden` membuatnya tidak dibacakan pembaca layar.
 */
export function HoneypotField({
  inputRef,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
    >
      <label htmlFor={HONEYPOT_FIELD}>Nomor referensi (biarkan kosong)</label>
      <input
        ref={inputRef}
        type="text"
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

/** Nilai honeypot dari DOM. String kosong berarti tidak terisi. */
export function nilaiHoneypot(
  inputRef: RefObject<HTMLInputElement | null>,
): string {
  return inputRef.current?.value ?? "";
}
