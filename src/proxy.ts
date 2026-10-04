import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { normalkanLoginPath } from "@/shared/env";

/**
 * Proxy untuk route /admin dan halaman masuk admin.
 *
 * Berkas ini bernama proxy.ts, bukan middleware.ts: konvensi `middleware`
 * deprecated sejak Next.js 16 dan diganti `proxy`. Fungsinya identik; yang
 * berubah hanya nama berkas dan nama ekspornya, plus runtime-nya kini selalu
 * Node.js (bukan edge) — itu justru pas untuk @supabase/ssr.
 *
 * Tiga tugas:
 *   1. Memperbarui cookie sesi supaya token yang mendekati kedaluwarsa
 *      diperpanjang dan admin tidak terlempar keluar di tengah pekerjaan.
 *   2. Mengalihkan permintaan /admin tanpa sesi sah ke BERANDA — bukan ke
 *      halaman masuk. Pemindai otomatis yang mencoba /admin tidak menemukan
 *      form masuk sama sekali.
 *   3. Melayani halaman masuk di alamat rahasia dari ADMIN_LOGIN_PATH.
 *
 * Perlu dinyatakan jujur: tugas 2 dan 3 MENGURANGI KEBISINGAN bot, bukan
 * menambah keamanan. Batas keamanan yang sebenarnya adalah pemeriksaan sesi di
 * sini dan requireAdmin() di dalam setiap aksi tulis — dan proxy sendiri bukan
 * batas keamanan, karena ia tidak berjalan di jalur pemanggilan Server Action.
 */

/** Tujuan semula disimpan sebentar di cookie, bukan di alamat. */
const COOKIE_TUJUAN = "adm_tujuan";

/** Peringatan konfigurasi dicatat sekali saja, bukan tiap permintaan. */
let sudahMemperingatkan = false;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const loginPath = normalkanLoginPath(process.env.ADMIN_LOGIN_PATH);
  const diHalamanMasuk = loginPath !== null && pathname === loginPath;
  const diRouteAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Tanpa ADMIN_LOGIN_PATH yang sah, TIDAK ADA alamat yang melayani halaman
  // masuk: /admin dialihkan ke beranda dan /admin/login juga, sehingga pemilik
  // terkunci dari dashboardnya sendiri. Situsnya tetap tampak normal, jadi
  // tanpa catatan ini kesalahan konfigurasinya tidak meninggalkan jejak apa pun
  // untuk ditelusuri.
  if (loginPath === null && diRouteAdmin && !sudahMemperingatkan) {
    sudahMemperingatkan = true;
    console.error(
      "[proxy] ADMIN_LOGIN_PATH belum diatur atau tidak sah, sehingga halaman " +
        "masuk admin tidak dapat dicapai lewat alamat mana pun. Atur variabel " +
        "ini di Vercel (Project Settings > Environment Variables) lalu deploy " +
        "ulang. Nilainya satu potongan alamat berisi huruf, angka, dan tanda " +
        'hubung saja — contoh: "masuk-7f3a9c21".',
    );
  }

  // KELUAR LEBIH AWAL untuk seluruh halaman publik.
  //
  // Matcher harus luas karena alamat masuk rahasia belum diketahui saat
  // konfigurasi ini dibaca. Tanpa penjagaan ini, setiap kunjungan ke halaman
  // publik akan ikut memanggil server Auth Supabase — satu perjalanan jaringan
  // tambahan di jalur terpanas situs, demi pemeriksaan yang tidak relevan.
  if (!diRouteAdmin && !diHalamanMasuk) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /**
   * getClaims(), BUKAN getUser().
   *
   * Proyek ini memakai kunci penanda tangan asimetris (ES256), sehingga
   * getClaims() memverifikasi tanda tangan JWT secara lokal lewat WebCrypto
   * dengan kunci publik yang di-cache — tanpa perjalanan jaringan ke server
   * Auth. Terukur di produksi: itu memotong sekitar separuh dari ~300 ms yang
   * dihabiskan setiap permintaan halaman admin dalam keadaan hangat.
   *
   * Yang TIDAK berubah: tanda tangan dan masa berlaku tetap diperiksa secara
   * kriptografis, jadi cookie palsu tetap ditolak di sini.
   *
   * Yang berubah dan perlu dinyatakan jujur: verifikasi lokal tidak mengetahui
   * sesi yang dicabut di server sebelum tokennya kedaluwarsa. Itu dapat
   * diterima untuk proxy, yang tugasnya mengarahkan halaman — dan karena itu
   * requireAdmin() di setiap aksi tulis SENGAJA tetap memakai getUser(), yang
   * bertanya langsung ke server Auth. Pemeriksaan longgar untuk navigasi,
   * pemeriksaan ketat untuk perubahan data.
   *
   * Panggilan ini sekaligus memperbarui token yang hampir kedaluwarsa, dan
   * cookie barunya ditulis ke response lewat setAll di atas.
   */
  const { data: klaim } = await supabase.auth.getClaims();

  const emailSesi = klaim?.claims?.email;
  const emailAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adalahAdmin =
    typeof emailSesi === "string" &&
    emailAdmin !== undefined &&
    emailSesi.trim().toLowerCase() === emailAdmin;

  // ----------------------------------------------------- Halaman masuk
  if (diHalamanMasuk) {
    if (adalahAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Dirender oleh route /admin/login, tetapi alamat di bilah tetap rahasia.
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const rewrite = NextResponse.rewrite(url, { request });
    rewrite.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return rewrite;
  }

  // ------------------------------------------------------ Route admin
  // /admin/login tidak boleh dibuka langsung; hanya lewat alamat rahasia.
  if (pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!adalahAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    const redirect = NextResponse.redirect(url);

    // Tujuan semula diingat lewat cookie berumur pendek, bukan lewat
    // parameter alamat: alamat halaman admin tidak ikut terlihat di bilah
    // alamat beranda, tetapi admin tetap diantar kembali setelah masuk.
    //
    // HANYA untuk navigasi halaman sungguhan. Prefetch Next dan permintaan RSC
    // juga melewati proxy ini, dan kalau ikut menulis cookie maka tujuan yang
    // sudah tersimpan tertimpa oleh tautan terakhir yang kebetulan diprefetch
    // — admin lalu diantar ke halaman yang tidak pernah ia minta.
    const navigasiHalaman =
      request.headers.get("sec-fetch-dest") === "document" &&
      request.headers.get("next-router-prefetch") === null &&
      request.headers.get("rsc") === null;

    if (navigasiHalaman) {
      redirect.cookies.set(COOKIE_TUJUAN, `${pathname}${search}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 10,
      });
    }

    return redirect;
  }

  // Konten admin tidak boleh muncul lagi lewat tombol kembali setelah logout.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

export const config = {
  /**
   * Alamat masuk rahasia belum diketahui saat konfigurasi ini dibaca, jadi
   * matcher harus cukup luas untuk mencakupnya. Fungsi di atas keluar lebih
   * awal untuk apa pun yang bukan route admin, sehingga halaman publik tidak
   * menanggung biaya tambahan.
   *
   * Berkas statis dan optimasi gambar dikecualikan supaya proxy tidak ikut
   * berjalan untuk CSS, JavaScript, dan gambar.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og.svg|robots.txt|sitemap.xml).*)",
  ],
};
