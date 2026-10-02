/**
 * Verifikasi situs produksi setelah deploy.
 *
 * Tidak memakai browser — semuanya dapat diperiksa lewat HTTP, dan itu membuat
 * skrip ini aman dijalankan kapan saja terhadap produksi tanpa menyentuh data.
 *
 * Pemakaian:
 *   node e2e/produksi.mjs https://domain-anda.com
 *
 * Tanpa argumen, URL diambil dari NEXT_PUBLIC_SITE_URL di .env.local.
 */

import { bacaEnvLokal } from "../scripts/env-lokal.mjs";

const e = bacaEnvLokal(new URL("../.env.local", import.meta.url));
const BASE = (process.argv[2] ?? e.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

if (!BASE) {
  console.error("URL produksi tidak diketahui. Berikan sebagai argumen pertama.");
  process.exit(1);
}

let gagal = 0;
const cek = (n, l, c = "") => {
  console.log(`  ${l ? "LULUS" : "GAGAL"}  ${n}${c ? ` — ${c}` : ""}`);
  if (!l) gagal += 1;
};

/** Menyusun cookie sesi dengan format yang ditulis @supabase/ssr. */
function cookieSesi(sesi, ref) {
  const nama = `sb-${ref}-auth-token`;
  const MAX = 3180;
  const nilai =
    "base64-" +
    Buffer.from(JSON.stringify(sesi), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  if (nilai.length <= MAX) return `${nama}=${nilai}`;

  const bagian = [];
  for (let i = 0; i * MAX < nilai.length; i += 1) {
    bagian.push(`${nama}.${i}=${nilai.slice(i * MAX, (i + 1) * MAX)}`);
  }
  return bagian.join("; ");
}

console.log(`Verifikasi produksi — ${BASE}\n`);

// --------------------------------------------------------------- Halaman publik
const HALAMAN = [
  ["/", "Beranda"],
  ["/tentang", "Tentang"],
  ["/pendidikan", "Pendidikan"],
  ["/keahlian", "Keahlian"],
  ["/pengalaman", "Pengalaman"],
  ["/proyek", "Proyek"],
  ["/pencapaian", "Pencapaian"],
  ["/kontak", "Kontak"],
];

const judul = new Set();

for (const [path, label] of HALAMAN) {
  const r = await fetch(`${BASE}${path}`);
  const html = await r.text();
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  judul.add(t);

  cek(
    `${label.padEnd(11)} dirender`,
    r.status === 200 && html.includes("</main>"),
    `HTTP ${r.status}`,
  );
}

cek("judul setiap halaman berbeda", judul.size === HALAMAN.length, `${judul.size} judul unik`);

// --------------------------------------------------------------- SEO
{
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  cek("sitemap memakai domain produksi", sm.includes(`<loc>${BASE}/`), BASE);
  cek("sitemap memuat halaman proyek", /\/proyek\/[a-z0-9-]+<\/loc>/.test(sm));

  const rb = await (await fetch(`${BASE}/robots.txt`)).text();
  cek("robots menutup /admin", rb.includes("Disallow: /admin"));
  cek("robots menunjuk sitemap produksi", rb.includes(`Sitemap: ${BASE}/sitemap.xml`));

  const og = (await (await fetch(`${BASE}/`)).text()).match(
    /property="og:url" content="([^"]*)"/,
  )?.[1];
  cek("Open Graph memakai URL absolut produksi", (og ?? "").startsWith(BASE), og ?? "-");
}

// --------------------------------------------------------------- Konten draf
{
  const pr = await (await fetch(`${BASE}/proyek`)).text();
  cek("tidak ada proyek draf yang bocor", !pr.includes("Belum Selesai"));
}

// --------------------------------------------------------------- Dashboard
{
  const a = await fetch(`${BASE}/admin`, { redirect: "manual" });
  const body = await a.text();
  cek("/admin tanpa sesi → dialihkan", a.status === 307 || a.status === 302, `HTTP ${a.status}`);
  cek("tidak ada konten admin terkirim", !body.includes("Navigasi dashboard"));

  const lg = await (await fetch(`${BASE}/admin/login`)).text();
  cek("halaman login dirender", lg.includes("Masuk ke Dashboard"));
  cek(
    "ADMIN_EMAIL tidak muncul di HTML",
    !e.ADMIN_EMAIL || !lg.includes(e.ADMIN_EMAIL),
  );

  // Login sungguhan hanya diuji bila password tersedia di .env.local.
  if (e.ADMIN_EMAIL && e.ADMIN_TEMP_PASSWORD && e.NEXT_PUBLIC_SUPABASE_URL) {
    const ref = new URL(e.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

    const sesi = await (
      await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: e.ADMIN_EMAIL,
          password: e.ADMIN_TEMP_PASSWORD,
        }),
      })
    ).json();

    if (sesi.access_token) {
      const ok = await fetch(`${BASE}/admin`, {
        headers: { cookie: cookieSesi(sesi, ref) },
        redirect: "manual",
      });
      const okh = await ok.text();
      cek(
        "sesi admin → dashboard terkirim",
        ok.status === 200 && okh.includes("Navigasi dashboard"),
        `HTTP ${ok.status}`,
      );
      cek(
        "respons admin dilarang di-cache",
        (ok.headers.get("cache-control") ?? "").includes("no-store"),
        ok.headers.get("cache-control") ?? "-",
      );

      // Email di dalam cookie dipalsukan.
      //
      // Hasil yang BENAR di sini adalah tetap 200, dan itu justru buktinya:
      // aplikasi memanggil getUser(), yang memverifikasi access token ke
      // server Auth dan mengembalikan email dari sana — isi cookie tidak
      // dipercaya sama sekali. Token ini milik admin sungguhan, jadi email
      // yang terbaca tetap email admin.
      //
      // Arah sebaliknya — pengguna sah yang BUKAN admin — ditolak; itu diuji
      // terpisah dengan menjalankan server ber-ADMIN_EMAIL berbeda.
      const emailPalsu = JSON.parse(JSON.stringify(sesi));
      emailPalsu.user.email = "orang.lain@contoh.test";
      const ep = await fetch(`${BASE}/admin`, {
        headers: { cookie: cookieSesi(emailPalsu, ref) },
        redirect: "manual",
      });
      cek(
        "email di cookie tidak dipercaya (diverifikasi ke server Auth)",
        ep.status === 200,
        `HTTP ${ep.status}`,
      );

      // Access token dirusak: tanda tangannya tidak lagi sah, harus ditolak.
      const tokenRusak = JSON.parse(JSON.stringify(sesi));
      tokenRusak.access_token = `${sesi.access_token.slice(0, -6)}XXXXXX`;
      tokenRusak.refresh_token = "tidak-berlaku";
      const tr = await fetch(`${BASE}/admin`, {
        headers: { cookie: cookieSesi(tokenRusak, ref) },
        redirect: "manual",
      });
      cek(
        "access token yang dirusak ditolak",
        tr.status === 307 || tr.status === 302,
        `HTTP ${tr.status}`,
      );
    } else {
      console.log("  LEWAT  login admin — kredensial di .env.local tidak berlaku");
    }
  } else {
    console.log("  LEWAT  login admin — ADMIN_TEMP_PASSWORD tidak ada di .env.local");
  }
}

console.log(`\n${gagal === 0 ? "Semua pemeriksaan produksi LULUS." : `${gagal} pemeriksaan GAGAL.`}`);
process.exit(gagal === 0 ? 0 : 1);
