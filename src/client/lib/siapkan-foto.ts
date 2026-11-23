"use client";

import { EKSTENSI_GAMBAR_WEB } from "@/shared/media";

const SISI_MAKS = 1600;
const MUTU_WEBP = 0.82;

type FormatKhusus = "heic" | "tiff";
type SumberFoto = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

function formatDariNama(file: File): FormatKhusus | undefined {
  if (/\.(heic|heif|heics|heifs|hif)$/i.test(file.name) || /^image\/hei[cf]/.test(file.type)) {
    return "heic";
  }
  if (/\.tiff?$/i.test(file.name) || file.type === "image/tiff") return "tiff";
}

async function formatDariIsi(file: File): Promise<FormatKhusus | undefined> {
  const kepala = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const kode = String.fromCharCode(...kepala);
  if (kode.startsWith("II*\0") || kode.startsWith("MM\0*")) return "tiff";
  if (kode.slice(4, 8) !== "ftyp") return;

  const merek = new Set([
    "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1",
  ]);
  for (let i = 8; i + 4 <= kode.length; i += 4) {
    // Byte 12–15 menyimpan versi, di antara merek utama dan merek kompatibel.
    if (i !== 12 && merek.has(kode.slice(i, i + 4))) return "heic";
  }
}

async function bacaDiPeramban(file: File): Promise<SumberFoto> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const gambar = new Image();
      gambar.src = url;
      await gambar.decode();
      return gambar;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function bacaFoto(file: File, format?: FormatKhusus): Promise<SumberFoto> {
  try {
    return await bacaDiPeramban(file);
  } catch {
    const khusus = format ?? await formatDariIsi(file);
    if (khusus === "heic") {
      const { heicTo } = await import("heic-to/csp");
      return heicTo({ blob: file, type: "bitmap" });
    }
    if (khusus === "tiff") {
      const { dekodeTiff } = await import("./dekode-tiff");
      return dekodeTiff(file);
    }
    throw new Error("Format gambar tidak didukung.");
  }
}

async function kompres(gambar: SumberFoto): Promise<Blob | null> {
  const lebar = gambar.width;
  const tinggi = gambar.height;
  if (lebar <= 0 || tinggi <= 0) return null;
  const skala = Math.min(1, SISI_MAKS / Math.max(lebar, tinggi));

  const kanvas = document.createElement("canvas");
  kanvas.width = Math.max(1, Math.round(lebar * skala));
  kanvas.height = Math.max(1, Math.round(tinggi * skala));
  const ctx = kanvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
  return new Promise((selesai) => kanvas.toBlob(selesai, "image/webp", MUTU_WEBP));
}

export async function siapkanFoto(file: File): Promise<File> {
  const format = formatDariNama(file);
  const sudahWeb = !format && EKSTENSI_GAMBAR_WEB.has(file.type);
  // Pertahankan berkas yang sudah efisien, animasi, dan gambar vektor.
  if (sudahWeb && file.type !== "image/jpeg" && file.type !== "image/png") return file;
  if (file.size === 0) throw new Error("Berkas kosong atau gagal dibaca.");

  let gambar: SumberFoto | undefined;
  try {
    gambar = await bacaFoto(file, format);
    const blob = await kompres(gambar);
    const ekstensi = blob ? EKSTENSI_GAMBAR_WEB.get(blob.type) : undefined;
    if (blob && ekstensi && (!sudahWeb || (blob.type === "image/webp" && blob.size < file.size))) {
      const nama = file.name.replace(/\.[^.]+$/, "") || "foto";
      return new File([blob], `${nama}.${ekstensi}`, { type: blob.type });
    }
  } catch {
    // JPG dan PNG yang dapat diunggah tetap boleh dipakai jika optimasi gagal.
  } finally {
    if (gambar && "close" in gambar) gambar.close();
  }
  if (sudahWeb) return file;
  throw new Error("Format gambar tidak didukung atau berkasnya tidak dapat dibaca.");
}
