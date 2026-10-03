import { bacaEnvLokal } from "../scripts/env-lokal.mjs";

/** Isi .env.local, dipakai seluruh skrip e2e. */
export const env = bacaEnvLokal(new URL("../.env.local", import.meta.url));

/**
 * Alamat rahasia halaman masuk admin.
 *
 * `/admin/login` tidak dapat dibuka langsung — proxy.ts mengalihkannya ke
 * beranda. Halaman masuk hanya dicapai lewat alamat ini.
 */
export function loginPath() {
  const nilai = (env.ADMIN_LOGIN_PATH ?? "").replaceAll("/", "").trim();
  if (nilai === "") {
    throw new Error("ADMIN_LOGIN_PATH belum diisi di .env.local");
  }
  return `/${nilai}`;
}

/** Masuk sebagai admin lewat alamat rahasia, lalu menunggu sampai di dashboard. */
export async function masukSebagaiAdmin(page, base, tujuan = /\/admin$/) {
  await page.goto(`${base}${loginPath()}`, { waitUntil: "load" });
  await page.getByLabel("Email").fill(env.ADMIN_EMAIL);
  await page.getByLabel("Password").fill(env.ADMIN_TEMP_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(tujuan, { timeout: 25000 });
}
