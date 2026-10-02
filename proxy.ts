import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy untuk seluruh route /admin.
 *
 * Berkas ini bernama proxy.ts, bukan middleware.ts: konvensi `middleware`
 * deprecated sejak Next.js 16 dan diganti `proxy`. Fungsinya identik; yang
 * berubah hanya nama berkas dan nama ekspornya, plus runtime-nya kini selalu
 * Node.js (bukan edge) — itu justru pas untuk @supabase/ssr.
 *
 * Dua tugas:
 *   1. Memperbarui cookie sesi supaya token yang mendekati kedaluwarsa
 *      diperpanjang dan admin tidak terlempar keluar di tengah pekerjaan.
 *   2. Mengalihkan permintaan tanpa sesi sah ke /admin/login, sambil menyimpan
 *      tujuan semula supaya setelah login ia kembali ke sana.
 *
 * Ini LAPISAN PENGALAMAN PENGGUNA, bukan batas keamanan — proxy tidak
 * berjalan di jalur pemanggilan Server Action. Penegakan yang sebenarnya ada
 * di requireAdmin() di dalam setiap aksi. Lihat lib/auth.ts.
 */
export async function proxy(request: NextRequest) {
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

  // Memanggil getUser() di sini sekaligus memperbarui token bila perlu, dan
  // cookie barunya ditulis ke response lewat setAll di atas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const diHalamanLogin = pathname === "/admin/login";

  const emailAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adalahAdmin =
    user?.email !== undefined &&
    emailAdmin !== undefined &&
    user.email.trim().toLowerCase() === emailAdmin;

  // Belum masuk (atau bukan admin) dan membuka route admin → ke halaman login.
  if (!adalahAdmin && !diHalamanLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    // Tujuan semula disimpan supaya login mengantar kembali ke sana.
    url.searchParams.set("lanjut", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Sudah masuk sebagai admin tetapi membuka halaman login → ke dashboard.
  if (adalahAdmin && diHalamanLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Konten admin tidak boleh muncul lagi lewat tombol kembali setelah logout.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
