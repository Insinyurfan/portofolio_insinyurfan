/**
 * Memeriksa rasio kontras setiap pasangan token teks/latar pada tema terang
 * dan gelap terhadap WCAG AA (4.5:1 teks normal, 3:1 teks besar / komponen).
 *
 * Nilai diambil dari app/globals.css supaya pemeriksaan ini tidak bisa
 * diam-diam melenceng dari token yang benar-benar dipakai.
 *
 * Jalankan: node scripts/check-contrast.mjs
 */

import { readFile } from "node:fs/promises";

const CSS_PATH = new URL("../app/globals.css", import.meta.url);

/** Ambil blok `:root { ... }` atau `.dark { ... }` beserta deklarasi --token. */
function parseTokens(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Blok ${selector} tidak ditemukan`);

  let depth = 0;
  let end = start;
  for (let i = css.indexOf("{", start); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const body = css.slice(start, end);
  const tokens = {};
  for (const match of body.matchAll(/--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pasangan yang harus diperiksa.
 * level "normal" = AA teks normal (4.5), "large" = AA teks besar / komponen (3).
 */
const PAIRS = [
  // Teks di atas latar halaman
  ["text", "surface", "normal"],
  ["text-muted", "surface", "normal"],
  ["text-subtle", "surface", "normal"],
  // Teks di atas kartu
  ["text", "surface-raised", "normal"],
  ["text-muted", "surface-raised", "normal"],
  ["text-subtle", "surface-raised", "normal"],
  // Teks di atas permukaan cekung
  ["text", "surface-sunken", "normal"],
  ["text-muted", "surface-sunken", "normal"],
  // Aksen sebagai tautan dan teks penekanan
  ["accent", "surface", "normal"],
  ["accent", "surface-raised", "normal"],
  ["accent-hover", "surface-raised", "normal"],
  // Teks di atas tombol aksen
  ["accent-contrast", "accent", "normal"],
  ["accent-contrast", "accent-hover", "normal"],
  // Badge aksen lembut
  ["accent-soft-text", "accent-soft", "normal"],
  // Garis dan fokus sebagai komponen non-teks
  ["border-strong", "surface", "large"],
  ["border-strong", "surface-raised", "large"],
  ["focus", "surface", "large"],
  ["focus", "surface-raised", "large"],
];

const AMBANG = { normal: 4.5, large: 3 };

const css = await readFile(CSS_PATH, "utf8");
const themes = {
  terang: parseTokens(css, ":root"),
  gelap: parseTokens(css, ".dark"),
};

let gagal = 0;
const baris = [];

for (const [namaTema, tokens] of Object.entries(themes)) {
  for (const [fg, bg, level] of PAIRS) {
    const warnaFg = tokens[fg];
    const warnaBg = tokens[bg];

    if (!warnaFg || !warnaBg) {
      console.error(`  TOKEN HILANG di tema ${namaTema}: ${!warnaFg ? fg : bg}`);
      gagal += 1;
      continue;
    }

    const rasio = contrast(warnaFg, warnaBg);
    const ambang = AMBANG[level];
    const lulus = rasio >= ambang;
    if (!lulus) gagal += 1;

    baris.push(
      [
        lulus ? "LULUS" : "GAGAL",
        namaTema.padEnd(6),
        `${fg} / ${bg}`.padEnd(42),
        `${rasio.toFixed(2)}:1`.padStart(8),
        `(min ${ambang})`,
      ].join("  "),
    );
  }
}

console.log("Pemeriksaan kontras token — WCAG AA\n");
console.log(baris.join("\n"));
console.log(
  `\n${gagal === 0 ? "Semua pasangan lulus." : `${gagal} pasangan GAGAL.`}`,
);

process.exit(gagal === 0 ? 0 : 1);
