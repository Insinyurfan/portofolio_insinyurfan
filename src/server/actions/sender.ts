import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { rateLimitSalt } from "@/shared/env";

/**
 * Pengenal pengirim untuk pembatasan laju.
 *
 * Alamat IP di-hash bersama garam, bukan disimpan mentah: pembatasan laju
 * hanya perlu MEMBEDAKAN pengirim, tidak perlu mengetahui identitasnya. Dengan
 * begitu tabel penghitung tidak menjadi catatan alamat pengunjung.
 *
 * Garamnya penting. Tanpa garam, hash alamat IPv4 dapat dibalik hanya dengan
 * menghitung hash seluruh ruang alamat — sekitar empat miliar, yang murah.
 */

/**
 * Mengambil alamat IP dari header proxy.
 *
 * `x-forwarded-for` dapat memuat rantai alamat; yang paling kiri adalah klien
 * aslinya menurut proxy terdekat. Di Vercel header ini diisi platform dan
 * tidak dapat dipalsukan klien.
 */
async function alamatPengirim(): Promise<string> {
  const h = await headers();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const pertama = forwarded.split(",")[0]?.trim();
    if (pertama) return pertama;
  }

  const real = h.get("x-real-ip");
  if (real) return real.trim();

  // Pengembangan lokal sering tidak punya header ini. Nilai tetap berarti
  // seluruh lalu lintas lokal berbagi satu kuota — itu justru memudahkan
  // menguji pembatasan laju.
  return "lokal";
}

export async function senderHash(): Promise<string> {
  const alamat = await alamatPengirim();

  return createHash("sha256")
    .update(`${rateLimitSalt()}:${alamat}`)
    .digest("hex");
}
