/**
 * Verifikasi dashboard admin lewat browser sungguhan.
 *
 * Menguji hal-hal yang TIDAK bisa diverifikasi lewat curl: login, CRUD,
 * dialog konfirmasi, toast, pengurutan, toggle terbit, navigasi keyboard,
 * dan apakah perubahan langsung tercermin di halaman publik.
 */

import { chromium } from "playwright";
import { bacaEnvLokal } from "../scripts/env-lokal.mjs";

const PORT = process.argv[2] ?? "3020";
const BASE = `http://localhost:${PORT}`;

const e = bacaEnvLokal(new URL("../.env.local", import.meta.url));

let gagal = 0;
const cek = (nama, lulus, catatan = "") => {
  console.log(`  ${lulus ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!lulus) gagal += 1;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const errorKonsol = [];
page.on("console", (m) => {
  if (m.type() === "error") errorKonsol.push(m.text());
});
page.on("pageerror", (err) => errorKonsol.push(String(err)));

try {
  // =========================================================== LOGIN
  console.log("\n— Login —");

  await page.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });
  cek(
    "route admin tanpa sesi → halaman login",
    page.url().includes("/admin/login"),
    page.url().replace(BASE, ""),
  );

  // Field kosong: pesan validasi muncul, tanpa permintaan autentikasi.
  let adaRequestAuth = false;
  const pantau = (req) => {
    if (req.url().includes("/auth/v1/token")) adaRequestAuth = true;
  };
  page.on("request", pantau);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForTimeout(600);
  cek(
    "field kosong → pesan validasi muncul",
    (await page.getByText("Email wajib diisi.").count()) > 0,
  );
  cek("field kosong → tidak ada permintaan autentikasi", !adaRequestAuth);
  page.off("request", pantau);

  // Kredensial salah: pesan generik, password dikosongkan.
  await page.getByLabel("Email").fill(e.ADMIN_EMAIL);
  await page.getByLabel("Password").fill("passwordsalah123");
  await page.getByRole("button", { name: "Masuk" }).click();
  // Sasar alert milik form secara spesifik: sonner juga memasang live region
  // ber-role alert, jadi getByRole("alert") saja tidak unik.
  const alertForm = page.locator("p[role=alert]");
  await alertForm.waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  const pesanSalah = (await alertForm.first().textContent().catch(() => "")) ?? "";
  cek(
    "kredensial salah → pesan generik",
    (pesanSalah ?? "").includes("Email atau password salah"),
    (pesanSalah ?? "").slice(0, 45),
  );
  cek(
    "kredensial salah → tidak membocorkan email terdaftar",
    !(pesanSalah ?? "").toLowerCase().includes("tidak terdaftar") &&
      !(pesanSalah ?? "").toLowerCase().includes("tidak ditemukan"),
  );
  cek(
    "kredensial salah → field password dikosongkan",
    (await page.getByLabel("Password").inputValue()) === "",
  );

  // Login benar → diantar ke tujuan semula (/admin/proyek).
  await page.getByLabel("Password").fill(e.ADMIN_TEMP_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin\/proyek/, { timeout: 25000 });
  cek(
    "login berhasil → diantar ke tujuan semula",
    page.url().includes("/admin/proyek"),
    page.url().replace(BASE, ""),
  );

  // =========================================================== CRUD
  console.log("\n— CRUD tautan sosial —");

  await page.goto(`${BASE}/admin/tautan-sosial`, { waitUntil: "load" });

  // URL tidak sah ditolak dengan pesan pada field.
  await page.getByRole("button", { name: "Tambah tautan sosial" }).first().click();
  await page.getByLabel("Platform").fill("uji-e2e");
  await page.getByLabel("URL").fill("bukan-url");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(700);
  cek(
    "URL tidak sah → pesan error pada field",
    (await page.getByText("Harus diawali http://").count()) > 0,
  );
  cek(
    "isian form tetap utuh setelah gagal",
    (await page.getByLabel("Platform").inputValue()) === "uji-e2e",
  );

  // Simpan yang sah → toast sukses, item muncul.
  await page.getByLabel("URL").fill("https://contoh.test/uji-e2e");
  await page.getByRole("button", { name: "Simpan" }).click();
  await page.waitForTimeout(3000);
  cek(
    "simpan sah → toast sukses muncul",
    (await page.getByText("Tautan sosial ditambahkan.").count()) > 0,
  );
  cek(
    "item baru muncul di daftar",
    (await page.getByText("uji-e2e", { exact: true }).count()) > 0,
  );

  // Toggle sembunyikan.
  await page.getByRole("button", { name: "Sembunyikan uji-e2e" }).click();
  await page.waitForTimeout(2500);
  cek(
    "toggle sembunyikan → penanda Tersembunyi",
    (await page.getByRole("button", { name: "Terbitkan uji-e2e" }).count()) > 0,
  );

  // Tidak tampil di halaman publik saat tersembunyi.
  const pub = await ctx.newPage();
  await pub.goto(`${BASE}/kontak`, { waitUntil: "load" });
  cek(
    "item tersembunyi tidak tampil di halaman publik",
    !(await pub.content()).includes("contoh.test/uji-e2e"),
  );

  // Terbitkan kembali → tampil di publik (bukti revalidatePath bekerja).
  await page.getByRole("button", { name: "Terbitkan uji-e2e" }).click();
  await page.waitForTimeout(2500);
  await pub.goto(`${BASE}/kontak`, { waitUntil: "load" });
  cek(
    "diterbitkan → langsung tampil di publik tanpa menunggu ISR",
    (await pub.content()).includes("contoh.test/uji-e2e"),
  );

  // ================================================ DIALOG KONFIRMASI
  console.log("\n— Dialog konfirmasi hapus —");

  await page.getByRole("button", { name: "Hapus uji-e2e" }).click();
  await page.waitForTimeout(400);
  const dialog = page.getByRole("alertdialog");
  cek("dialog konfirmasi terbuka", (await dialog.count()) > 0);
  cek(
    "dialog menyebut nama item",
    ((await dialog.textContent()) ?? "").includes("uji-e2e"),
  );

  // Escape membatalkan, item tidak terhapus.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  cek("Escape menutup dialog", (await page.getByRole("alertdialog").count()) === 0);
  cek(
    "pembatalan tidak menghapus apa pun",
    (await page.getByText("uji-e2e", { exact: true }).count()) > 0,
  );

  // Batal lewat tombol.
  await page.getByRole("button", { name: "Hapus uji-e2e" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Batal" }).click();
  await page.waitForTimeout(300);
  cek(
    "tombol Batal menutup dialog tanpa menghapus",
    (await page.getByRole("alertdialog").count()) === 0 &&
      (await page.getByText("uji-e2e", { exact: true }).count()) > 0,
  );

  // Konfirmasi → benar-benar terhapus.
  await page.getByRole("button", { name: "Hapus uji-e2e" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Hapus", exact: true }).last().click();
  await page.waitForTimeout(3000);
  cek(
    "konfirmasi → item terhapus",
    (await page.getByText("uji-e2e", { exact: true }).count()) === 0,
  );
  cek("toast hapus muncul", (await page.getByText("Item dihapus.").count()) > 0);

  // =========================================================== PENGURUTAN
  console.log("\n— Pengurutan —");

  await page.goto(`${BASE}/admin/tautan-sosial`, { waitUntil: "load" });

  const namaAwal = await page
    .locator("ul > li p.font-medium")
    .allTextContents();
  cek("daftar punya minimal 2 item untuk diuji", namaAwal.length >= 2, `${namaAwal.length} item`);

  const pertama = namaAwal[0];
  const kedua = namaAwal[1];

  cek(
    "tombol naik pada item pertama dinonaktifkan",
    await page.getByRole("button", { name: `Pindahkan ${pertama} ke atas` }).isDisabled(),
  );
  cek(
    "tombol turun pada item terakhir dinonaktifkan",
    await page
      .getByRole("button", {
        name: `Pindahkan ${namaAwal[namaAwal.length - 1]} ke bawah`,
      })
      .isDisabled(),
  );

  await page.getByRole("button", { name: `Pindahkan ${pertama} ke bawah` }).click();
  await page.waitForTimeout(3000);
  const namaSesudah = await page.locator("ul > li p.font-medium").allTextContents();
  cek(
    "tombol turun menukar posisi",
    namaSesudah[0] === kedua && namaSesudah[1] === pertama,
    `${namaSesudah.slice(0, 2).join(", ")}`,
  );

  // Urutan bertahan setelah muat ulang.
  await page.reload({ waitUntil: "load" });
  const namaMuatUlang = await page.locator("ul > li p.font-medium").allTextContents();
  cek(
    "urutan bertahan setelah muat ulang",
    namaMuatUlang[0] === kedua && namaMuatUlang[1] === pertama,
  );

  // Kembalikan ke urutan semula.
  await page.getByRole("button", { name: `Pindahkan ${pertama} ke atas` }).click();
  await page.waitForTimeout(2500);

  // =========================================== PROFIL & ANIMASI KETIK
  console.log("\n— Editor profil —");

  await page.goto(`${BASE}/admin/profil`, { waitUntil: "load" });

  // Tambah role lewat daftar, lalu simpan.
  await page.getByLabel("Tambah Daftar role").fill("Penguji E2E");
  await page.getByRole("button", { name: "Tambah", exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await page.waitForTimeout(3500);
  cek("profil tersimpan", (await page.getByText("Profil tersimpan.").count()) > 0);

  await pub.goto(`${BASE}/`, { waitUntil: "load" });
  cek(
    "role baru langsung tampil di beranda",
    (await pub.content()).includes("Penguji E2E"),
  );

  // Role dengan spasi saja harus dibuang.
  await page.goto(`${BASE}/admin/profil`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Hapus Penguji E2E" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await page.waitForTimeout(3500);
  await pub.goto(`${BASE}/`, { waitUntil: "load" });
  cek(
    "role dihapus → hilang dari beranda",
    !(await pub.content()).includes("Penguji E2E"),
  );

  // ====================================================== KEYBOARD
  console.log("\n— Navigasi keyboard —");

  await page.goto(`${BASE}/admin/pendidikan`, { waitUntil: "load" });
  await page.keyboard.press("Tab");
  const fokusPertama = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}:${(el.textContent ?? "").trim().slice(0, 28)}` : "none";
  });
  cek("Tab pertama memfokuskan kontrol", fokusPertama !== "none", fokusPertama);

  // Buka form dengan keyboard saja.
  await page.getByRole("button", { name: "Tambah pendidikan" }).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  cek(
    "form terbuka lewat keyboard",
    (await page.getByLabel("Institusi").count()) > 0,
  );
  await page.getByRole("button", { name: "Batal" }).click();

  // ====================================================== RESPONSIF
  console.log("\n— Responsif 360px —");

  const sempit = await ctx.newPage();
  await sempit.setViewportSize({ width: 360, height: 760 });
  await sempit.goto(`${BASE}/admin/proyek`, { waitUntil: "load" });

  const adaScrollH = await sempit.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  cek("tidak ada scroll horizontal di 360px", !adaScrollH);

  cek(
    "sidebar diringkas di balik tombol",
    (await sempit.getByRole("button", { name: "Buka menu", exact: true }).count()) > 0,
  );

  await sempit.getByRole("button", { name: "Buka menu", exact: true }).click();
  await sempit.waitForTimeout(500);
  cek(
    "panel sidebar terbuka",
    (await sempit.getByRole("navigation", { name: "Navigasi dashboard" }).count()) > 0,
  );

  await sempit.keyboard.press("Escape");
  await sempit.waitForTimeout(500);
  cek(
    "Escape menutup panel sidebar",
    (await sempit.getByRole("button", { name: "Buka menu", exact: true }).count()) > 0,
  );

  // ====================================================== TEMA GELAP
  console.log("\n— Tema gelap —");

  const gelap = await ctx.newPage();
  await gelap.emulateMedia({ colorScheme: "dark" });
  await gelap.goto(`${BASE}/admin`, { waitUntil: "load" });
  await gelap.waitForTimeout(800);
  const warnaAdmin = await gelap.evaluate(() => {
    const el = document.querySelector(".admin-root");
    return el ? getComputedStyle(el).backgroundColor : "none";
  });
  const adaClassDark = await gelap.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  cek(
    "token admin aktif di bawah .admin-root",
    warnaAdmin !== "none" && warnaAdmin !== "rgba(0, 0, 0, 0)",
    warnaAdmin,
  );
  cek("preferensi sistem gelap diikuti", adaClassDark, warnaAdmin);

  // ====================================================== LOGOUT
  console.log("\n— Logout —");

  await page.goto(`${BASE}/admin`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Keluar" }).first().click();
  await page.waitForURL(/\/admin\/login/, { timeout: 25000 });
  cek("logout → diarahkan ke login", page.url().includes("/admin/login"));

  await page.goBack({ waitUntil: "load" }).catch(() => {});
  await page.waitForTimeout(1200);
  cek(
    "tombol kembali setelah logout tidak menampilkan konten admin",
    !(await page.content()).includes("Navigasi dashboard"),
    page.url().replace(BASE, ""),
  );

  // ====================================================== KONSOL
  console.log("\n— Error runtime —");
  const serius = errorKonsol.filter(
    (m) =>
      !m.includes("favicon") &&
      !m.includes("Download the React DevTools") &&
      // 400 dari uji password-salah yang memang disengaja di atas.
      !m.includes("status of 400"),
  );
  cek(
    "tidak ada error runtime di konsol",
    serius.length === 0,
    serius.slice(0, 2).join(" | ").slice(0, 120),
  );
} finally {
  await browser.close();
}

console.log(`\n${gagal === 0 ? "Semua pemeriksaan browser LULUS." : `${gagal} pemeriksaan GAGAL.`}`);
process.exit(gagal === 0 ? 0 : 1);
