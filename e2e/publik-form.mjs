/**
 * Verifikasi form kontak, rating pengunjung, dan pratinjau CV.
 *
 * Termasuk jalur penolakan: honeypot, pembatasan laju, dan validasi yang
 * dilewati di peramban tetapi tetap ditolak server.
 *
 * Skrip ini MENULIS ke database (pesan dan rating uji) lalu membersihkannya
 * kembali lewat dashboard admin di akhir. Jangan dijalankan terhadap database
 * produksi yang sudah berisi kiriman asli.
 */

import { readFileSync } from "node:fs";

import pg from "pg";
import { chromium } from "playwright";

import { loginPath } from "./helpers.mjs";
import { bacaEnvLokal } from "../scripts/env-lokal.mjs";

const PORT = process.argv[2] ?? "3040";
const BASE = `http://localhost:${PORT}`;
const e = bacaEnvLokal(new URL("../.env.local", import.meta.url));

const TANDA = `uji-e2e-${Date.now()}`;

/**
 * Mengosongkan penghitung pembatasan laju.
 *
 * Dibutuhkan karena seluruh lalu lintas lokal berbagi satu pengenal pengirim,
 * sehingga menjalankan skrip ini dua kali berturut-turut akan kehabisan kuota
 * dan membuat form kontak ditolak — bukan karena bug, melainkan karena
 * pengujian sebelumnya. Tabelnya tertutup dari anon maupun authenticated,
 * jadi pembersihannya lewat koneksi database langsung.
 */
async function bersihkanPenghitungLaju() {
  if (!e.SUPABASE_DB_URL) {
    console.warn("  (SUPABASE_DB_URL tidak ada — penghitung laju tidak dibersihkan)");
    return;
  }
  const c = new pg.Client({
    connectionString: e.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  await c.query("delete from public.rate_limit_attempts");
  await c.end();
}

let gagal = 0;
const cek = (n, l, c = "") => {
  console.log(`  ${l ? "LULUS" : "GAGAL"}  ${n}${c ? ` — ${c}` : ""}`);
  if (!l) gagal += 1;
};

/** Klien Supabase sebagai anon, untuk memeriksa apa yang BOLEH dibaca publik. */
async function anonSelect(tabel, query = "") {
  const r = await fetch(
    `${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tabel}?select=*${query}`,
    { headers: { apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY } },
  );
  return { status: r.status, data: await r.json().catch(() => null) };
}

/** Token admin, untuk memeriksa data yang tidak boleh dibaca publik. */
async function tokenAdmin() {
  const r = await fetch(
    `${e.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: e.ADMIN_EMAIL,
        password: e.ADMIN_TEMP_PASSWORD,
      }),
    },
  );
  const j = await r.json();
  return j.access_token;
}

async function adminSelect(token, tabel, query = "") {
  const r = await fetch(
    `${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tabel}?select=*${query}`,
    {
      headers: {
        apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return r.json();
}

async function adminDelete(token, tabel, query) {
  await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tabel}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
}

const token = await tokenAdmin();
await bersihkanPenghitungLaju();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const errKonsol = [];
page.on("pageerror", (x) => errKonsol.push(String(x)));

try {
  // ========================================================= FORM KONTAK
  console.log("\n— Form kontak —");

  await page.goto(`${BASE}/kontak`, { waitUntil: "load" });

  cek(
    "form dan informasi kontak berdampingan",
    (await page.getByLabel("Pesan").count()) > 0 &&
      (await page.locator('a[href^="mailto:"]').count()) > 0,
  );

  // Field wajib kosong → pesan validasi, tanpa menyimpan apa pun.
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await page.waitForTimeout(700);
  cek(
    "field wajib kosong → pesan validasi per field",
    (await page.getByText("Wajib diisi.").count()) >= 2,
  );

  // Email tidak sah.
  await page.getByLabel("Nama").fill("Penguji E2E");
  await page.getByLabel("Email").fill("bukan-email");
  await page.getByLabel("Pesan").fill("Isi pesan uji.");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await page.waitForTimeout(700);
  cek(
    "email tidak sah → pesan error pada field",
    (await page.getByText("Format email tidak sah.").count()) > 0,
  );
  cek(
    "isian tetap utuh setelah gagal validasi",
    (await page.getByLabel("Nama").inputValue()) === "Penguji E2E",
  );

  // Pengiriman sah, tanpa subjek.
  await page.getByLabel("Email").fill("penguji@contoh.test");
  await page.getByLabel("Pesan").fill(`Pesan uji ${TANDA}`);
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await page.waitForTimeout(4000);

  cek(
    "pengiriman sah → konfirmasi berbahasa Indonesia",
    (await page.getByText("Pesan Anda terkirim").count()) > 0,
  );
  cek(
    "field dikosongkan setelah berhasil",
    (await page.getByLabel("Nama").inputValue()) === "",
  );

  const pesanTersimpan = await adminSelect(
    token,
    "messages",
    `&body=like.*${TANDA}*`,
  );
  cek(
    "pesan tersimpan sebagai belum dibaca",
    pesanTersimpan.length === 1 && pesanTersimpan[0]?.is_read === false,
    `${pesanTersimpan.length} baris`,
  );
  cek(
    "pesan tanpa subjek tersimpan",
    pesanTersimpan[0]?.subject === null,
    String(pesanTersimpan[0]?.subject),
  );

  // Pesan TIDAK boleh terbaca publik, termasuk yang baru dikirim sendiri.
  const pesanAnon = await anonSelect("messages");
  cek(
    "pesan tidak dapat dibaca publik",
    pesanAnon.status === 200 && Array.isArray(pesanAnon.data) && pesanAnon.data.length === 0,
    `HTTP ${pesanAnon.status}, ${Array.isArray(pesanAnon.data) ? pesanAnon.data.length : "?"} baris`,
  );

  // ========================================================= HONEYPOT
  console.log("\n— Honeypot —");

  await page.goto(`${BASE}/kontak`, { waitUntil: "load" });

  // Honeypot tidak pernah menerima fokus keyboard.
  const honeypotFokus = await page.evaluate(() => {
    const el = document.querySelector('input[name="nomor_referensi"]');
    return el ? el.tabIndex : null;
  });
  cek("honeypot tidak dapat menerima fokus (tabIndex -1)", honeypotFokus === -1, String(honeypotFokus));

  const honeypotTersembunyi = await page.evaluate(() => {
    const el = document.querySelector('input[name="nomor_referensi"]');
    const wrap = el?.closest("div");
    return wrap?.getAttribute("aria-hidden") === "true";
  });
  cek("honeypot disembunyikan dari pembaca layar", honeypotTersembunyi);

  // Isi honeypot lewat JavaScript, lalu kirim.
  const TANDA_HP = `${TANDA}-honeypot`;
  await page.getByLabel("Nama").fill("Bot");
  await page.getByLabel("Email").fill("bot@contoh.test");
  await page.getByLabel("Pesan").fill(`Pesan ${TANDA_HP}`);
  await page.evaluate(() => {
    const el = document.querySelector('input[name="nomor_referensi"]');
    if (el) {
      el.value = "terisi-bot";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await page.waitForTimeout(3500);

  cek(
    "honeypot terisi → tanggapan sama seperti berhasil",
    (await page.getByText("Pesan Anda terkirim").count()) > 0,
  );

  const pesanHp = await adminSelect(token, "messages", `&body=like.*${TANDA_HP}*`);
  cek("honeypot terisi → tidak ada data tersimpan", pesanHp.length === 0, `${pesanHp.length} baris`);

  // ========================================================= RATING
  console.log("\n— Rating pengunjung —");

  await page.goto(`${BASE}/`, { waitUntil: "load" });

  cek(
    "keadaan awal adalah form, bukan ucapan terima kasih",
    (await page.getByRole("button", { name: "Kirim penilaian" }).count()) > 0,
  );

  // Bintang belum dipilih → pesan error.
  await page.getByRole("button", { name: "Kirim penilaian" }).click();
  await page.waitForTimeout(700);
  cek(
    "bintang belum dipilih → pesan error",
    (await page.getByText("Pilih bintang dulu").count()) > 0,
  );

  // Pilih bintang dengan keyboard.
  await page.getByRole("radio", { name: "4 bintang" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(400);
  cek(
    "bintang dapat dipilih dengan keyboard",
    await page.getByRole("radio", { name: "4 bintang" }).isChecked(),
  );

  await page.locator("#reviewer_name").fill(`Penguji ${TANDA}`);
  await page.getByLabel("Komentar").fill("Komentar uji <script>alert(1)</script>");
  await page.getByRole("button", { name: "Kirim penilaian" }).click();
  await page.waitForTimeout(4000);

  cek(
    "rating terkirim → konfirmasi menyebut akan ditinjau",
    (await page.getByText("akan tampil setelah").count()) > 0 ||
      (await page.getByText("Terima kasih atas penilaian").count()) > 0,
  );

  const ratingTersimpan = await adminSelect(
    token,
    "ratings",
    `&reviewer_name=like.*${TANDA}*`,
  );
  cek(
    "rating tersimpan sebagai belum disetujui",
    ratingTersimpan.length === 1 && ratingTersimpan[0]?.is_approved === false,
    `${ratingTersimpan.length} baris, approved=${ratingTersimpan[0]?.is_approved}`,
  );
  cek("bintang tersimpan benar", ratingTersimpan[0]?.stars === 4, String(ratingTersimpan[0]?.stars));

  // Belum disetujui → tidak tampil dan tidak memengaruhi rata-rata.
  const pub2 = await ctx.newPage();
  await pub2.goto(`${BASE}/`, { waitUntil: "load" });
  cek(
    "rating belum disetujui tidak tampil di beranda",
    !(await pub2.content()).includes(`Penguji ${TANDA}`),
  );

  // Penanda peramban: form berganti jadi ucapan terima kasih.
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  cek(
    "penanda peramban → form berganti ucapan terima kasih",
    (await page.getByText("Terima kasih atas penilaian").count()) > 0,
  );

  // Pengunjung lain (konteks peramban baru) tetap melihat form.
  const ctxLain = await browser.newContext();
  const pLain = await ctxLain.newPage();
  await pLain.goto(`${BASE}/`, { waitUntil: "load" });
  await pLain.waitForTimeout(1000);
  cek(
    "pengunjung lain tetap melihat form rating",
    (await pLain.getByRole("button", { name: "Kirim penilaian" }).count()) > 0,
  );
  await ctxLain.close();

  // ============================================ MODERASI → TAMPIL
  console.log("\n— Moderasi rating → beranda —");

  const adm = await ctx.newPage();
  await adm.goto(`${BASE}${loginPath()}`, { waitUntil: "load" });
  await adm.getByLabel("Email").fill(e.ADMIN_EMAIL);
  await adm.getByLabel("Password").fill(e.ADMIN_TEMP_PASSWORD);
  await adm.getByRole("button", { name: "Masuk" }).click();
  await adm.waitForURL(/\/admin$/, { timeout: 25000 });

  await adm.goto(`${BASE}/admin/rating`, { waitUntil: "load" });
  cek(
    "rating muncul di moderasi sebagai menunggu",
    (await adm.getByText(`Penguji ${TANDA}`).count()) > 0 &&
      (await adm.getByText("Menunggu persetujuan").count()) > 0,
  );

  cek(
    "komentar berisi skrip dirender sebagai teks",
    (await adm.getByText("<script>alert(1)</script>").count()) > 0,
  );

  await adm.getByRole("button", { name: "Setujui" }).first().click();
  await adm.waitForTimeout(4000);

  await pub2.goto(`${BASE}/`, { waitUntil: "load" });
  const htmlSetelah = await pub2.content();
  cek(
    "disetujui → langsung tampil di beranda",
    htmlSetelah.includes(`Penguji ${TANDA}`),
  );
  cek(
    "komentar dirender sebagai teks di publik",
    htmlSetelah.includes("&lt;script&gt;") || !htmlSetelah.includes("<script>alert(1)"),
  );

  const ringkasan = await anonSelect("rating_summary");
  cek(
    "rata-rata menghitung rating yang disetujui",
    Array.isArray(ringkasan.data) && Number(ringkasan.data[0]?.total) >= 1,
    `total=${Array.isArray(ringkasan.data) ? ringkasan.data[0]?.total : "?"}`,
  );

  // Cabut persetujuan → hilang kembali.
  await adm.goto(`${BASE}/admin/rating`, { waitUntil: "load" });
  await adm.getByRole("button", { name: "Cabut" }).first().click();
  await adm.waitForTimeout(4000);

  await pub2.goto(`${BASE}/`, { waitUntil: "load" });
  cek(
    "persetujuan dicabut → hilang dari beranda",
    !(await pub2.content()).includes(`Penguji ${TANDA}`),
  );

  // ========================================================= PRATINJAU CV
  console.log("\n— Pratinjau CV —");

  // Profil contoh belum punya berkas CV. Supaya pratinjaunya benar-benar
  // teruji, sebuah PDF uji diunggah lewat dashboard, lalu DIBERSIHKAN lagi di
  // akhir sehingga profil kembali seperti semula.
  let cvDipasangOlehUji = false;

  if ((await pub2.getByRole("button", { name: "Pratinjau CV" }).count()) === 0) {
    await adm.goto(`${BASE}/admin/profil`, { waitUntil: "load" });

    // Disasar lewat LABEL, bukan `nth(1)`. Urutan input berkas di halaman
    // profil berubah begitu field berkas baru ditambahkan — saat field "Logo
    // header" disisipkan sebelum foto, indeks 1 berpindah dari CV ke foto dan
    // PDF uji masuk ke field yang salah tanpa ada yang gagal secara terlihat.
    // Form sungguhan harus sudah terpasang, bukan kerangka muatnya. Sejak
    // route group dashboard punya loading.tsx, `waitUntil: "load"` bisa
    // selesai saat yang tampil masih kerangka — mengisi lalu langsung menekan
    // Simpan kemudian berlomba dengan hidrasi react-hook-form, dan
    // penyimpanannya diam-diam tidak terjadi tanpa pesan error apa pun.
    await adm.waitForFunction(
      () => !document.querySelector('[aria-busy="true"]'),
      null,
      { timeout: 15000 },
    );

    const inputCv = adm.getByLabel("Berkas CV");
    await inputCv.setInputFiles({
      name: "cv-uji.pdf",
      mimeType: "application/pdf",
      buffer: readFileSync(new URL("./.tmp/cv-uji.pdf", import.meta.url)),
    });

    // Tombol Simpan nonaktif selama unggahan berjalan, jadi yang ditunggu
    // adalah tombol hapusnya muncul — bukti berkasnya sudah terpasang di form.
    await adm
      .getByRole("button", { name: "Hapus Berkas CV", exact: true })
      .waitFor({ timeout: 25000 });

    await adm.getByRole("button", { name: "Simpan profil" }).click();

    // Bukti tersimpan datang dari toastnya, bukan dari lamanya menunggu.
    await adm.getByText("Profil tersimpan.").waitFor({ timeout: 25000 });
    await adm.waitForTimeout(1500);

    cvDipasangOlehUji = true;
    await pub2.goto(`${BASE}/`, { waitUntil: "load" });
  }

  const adaCv = await pub2.getByRole("button", { name: "Pratinjau CV" }).count();

  if (adaCv === 0) {
    console.log("  LEWAT  profil belum punya berkas CV — tombol memang tidak dirender");
    cek(
      "tanpa CV, tombol unduh juga tidak dirender",
      (await pub2.getByRole("link", { name: "Unduh CV" }).count()) === 0,
    );
  } else {
    // PDF belum diunduh sebelum modal dibuka.
    const sebelum = [];
    pub2.on("request", (r) => {
      if (r.url().endsWith(".pdf")) sebelum.push(r.url());
    });
    await pub2.reload({ waitUntil: "load" });
    await pub2.waitForTimeout(1500);
    cek("PDF belum diambil sebelum modal dibuka", sebelum.length === 0, `${sebelum.length} permintaan`);

    const scrollSebelum = await pub2.evaluate(() => window.scrollY);
    await pub2.getByRole("button", { name: "Pratinjau CV" }).click();
    await pub2.waitForTimeout(1200);

    cek("modal pratinjau terbuka", (await pub2.getByRole("dialog").count()) > 0);
    cek(
      "modal diumumkan sebagai dialog beserta namanya",
      ((await pub2.getByRole("dialog").getAttribute("aria-label")) ?? "").includes("CV"),
    );
    cek(
      "tombol unduh dan buka di tab baru tersedia",
      (await pub2.getByRole("link", { name: "Unduh" }).count()) > 0 &&
        (await pub2.getByRole("link", { name: "Buka di tab baru" }).count()) > 0,
    );

    const fokusDiDialog = await pub2.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.contains(document.activeElement) : false;
    });
    cek("fokus berpindah ke dalam modal", fokusDiDialog);

    const bodyTerkunci = await pub2.evaluate(
      () => getComputedStyle(document.body).overflow === "hidden",
    );
    cek("halaman di belakang tidak dapat di-scroll", bodyTerkunci);

    await pub2.keyboard.press("Escape");
    await pub2.waitForTimeout(800);
    cek("Escape menutup modal", (await pub2.getByRole("dialog").count()) === 0);
    cek(
      "posisi scroll tetap setelah modal ditutup",
      (await pub2.evaluate(() => window.scrollY)) === scrollSebelum,
    );
    cek(
      "scroll halaman kembali normal",
      (await pub2.evaluate(() => getComputedStyle(document.body).overflow)) !== "hidden",
    );
  }

  // CV uji dilepas kembali supaya profil kembali seperti semula.
  if (cvDipasangOlehUji) {
    await adm.goto(`${BASE}/admin/profil`, { waitUntil: "load" });

    // Tunggu kerangka muat selesai, sama seperti saat memasangnya. Tanpa ini
    // tombol dicari ketika form sungguhannya belum terpasang.
    await adm.waitForFunction(
      () => !document.querySelector('[aria-busy="true"]'),
      null,
      { timeout: 15000 },
    );

    // Disasar dengan nama lengkapnya, BUKAN `name: "Hapus"` + `.last()`.
    // Playwright mencocokkan nama sebagai substring, sehingga pola lama ikut
    // menangkap tombol "Hapus <role>" di daftar role — dan karena kliknya
    // dibungkus catch kosong, kegagalannya tidak terlihat sementara satu role
    // milik pemilik terhapus dari database setiap kali uji ini dijalankan.
    const tombolHapusCv = adm.getByRole("button", {
      name: "Hapus Berkas CV",
      exact: true,
    });

    // Kegagalan di sini TIDAK boleh ditelan diam-diam. Versi sebelumnya
    // memakai `name: "Hapus"` + `.last()` dibungkus catch kosong: karena
    // Playwright mencocokkan nama sebagai substring, kliknya mendarat di
    // tombol "Hapus <role>" dan satu role milik pemilik ikut terhapus dari
    // database setiap kali uji ini dijalankan.
    if ((await tombolHapusCv.count()) === 0) {
      cek(
        "tombol hapus CV ditemukan untuk membersihkan CV uji",
        false,
        "tidak ada — CV uji kemungkinan gagal terpasang di langkah sebelumnya",
      );
    } else {
      await tombolHapusCv.click();
    }
    await adm.waitForTimeout(600);
    await adm.getByRole("button", { name: "Simpan profil" }).click();
    await adm.waitForTimeout(4000);

    await pub2.goto(`${BASE}/`, { waitUntil: "load" });
    cek(
      "CV uji dilepas → tombol pratinjau hilang kembali",
      (await pub2.getByRole("button", { name: "Pratinjau CV" }).count()) === 0,
    );
  }

  // ========================================================= BATAS LAJU
  console.log("\n— Pembatasan laju —");

  // Kuota bawaan 5 per jam per pengirim; pengiriman di atas itu ditolak.
  await bersihkanPenghitungLaju();
  const ctxLaju = await browser.newContext();
  const pLaju = await ctxLaju.newPage();
  let pesanTolak = "";

  for (let i = 0; i < 7; i += 1) {
    await pLaju.goto(`${BASE}/kontak`, { waitUntil: "load" });
    await pLaju.getByLabel("Nama").fill(`Laju ${i}`);
    await pLaju.getByLabel("Email").fill(`laju${i}@contoh.test`);
    await pLaju.getByLabel("Pesan").fill(`Uji batas laju ${TANDA} nomor ${i}`);
    await pLaju.getByRole("button", { name: "Kirim pesan" }).click();
    await pLaju.waitForTimeout(2500);

    const teks = (await pLaju.locator('[role="status"]').textContent().catch(() => "")) ?? "";
    if (teks.includes("coba lagi nanti")) {
      pesanTolak = teks;
      break;
    }
  }

  cek(
    "melebihi batas laju → ditolak dengan pesan berbahasa Indonesia",
    pesanTolak.includes("coba lagi nanti"),
    pesanTolak.slice(0, 60) || "(tidak pernah ditolak)",
  );

  const tersimpanLaju = await adminSelect(
    token,
    "messages",
    `&body=like.*batas laju ${TANDA}*`,
  );
  cek(
    "pengiriman yang ditolak tidak tersimpan",
    tersimpanLaju.length > 0 && tersimpanLaju.length <= 5,
    `${tersimpanLaju.length} tersimpan dari 7 percobaan`,
  );
  await ctxLaju.close();

  // ============================================ VALIDASI SISI SERVER
  console.log("\n— Validasi server sebagai penentu —");

  // Menyisipkan langsung lewat API dengan status dipalsukan.
  const palsu = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ratings`, {
    method: "POST",
    headers: {
      apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reviewer_name: `Curang ${TANDA}`,
      stars: 5,
      is_approved: true,
    }),
  });
  cek(
    "anon tidak dapat menyisipkan rating yang langsung disetujui",
    palsu.status >= 400,
    `HTTP ${palsu.status}`,
  );

  const bintangPalsu = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ratings`, {
    method: "POST",
    headers: {
      apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviewer_name: `Nol ${TANDA}`, stars: 0 }),
  });
  cek(
    "bintang di luar rentang ditolak database",
    bintangPalsu.status >= 400,
    `HTTP ${bintangPalsu.status}`,
  );

  const hitung = await fetch(
    `${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rate_limit_attempts?select=*`,
    { headers: { apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY } },
  );
  const hitungData = await hitung.json().catch(() => null);
  cek(
    "penghitung pembatasan laju tertutup dari publik",
    !Array.isArray(hitungData) || hitungData.length === 0,
    `HTTP ${hitung.status}`,
  );

  // ========================================================= KONSOL
  console.log("\n— Error runtime —");
  const serius = errKonsol.filter((m) => !/favicon|DevTools/.test(m));
  cek("tidak ada error runtime", serius.length === 0, serius.slice(0, 1).join("").slice(0, 90));
} finally {
  // Bersihkan seluruh data uji.
  await adminDelete(token, "messages", `body=like.*${TANDA}*`);
  await adminDelete(token, "ratings", `reviewer_name=like.*${TANDA}*`);
  await browser.close();
}

console.log(`\n${gagal === 0 ? "Semua pemeriksaan LULUS." : `${gagal} pemeriksaan GAGAL.`}`);
process.exit(gagal === 0 ? 0 : 1);
