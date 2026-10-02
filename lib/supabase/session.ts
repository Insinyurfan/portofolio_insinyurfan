import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Klien Supabase yang sadar sesi, untuk Server Component dan Server Action.
 *
 * Berbeda dari `lib/supabase/server.ts` (klien anon tanpa sesi yang dipakai
 * halaman publik): klien ini membaca cookie sesi, sehingga query berjalan
 * sebagai pengguna terautentikasi dan RLS mengembalikan baris draf juga.
 */
export async function createSessionSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Itu tidak masalah:
          // proxy.ts yang bertugas memperbarui cookie sesi, dan ia berjalan
          // lebih dulu pada setiap permintaan ke /admin.
        }
      },
    },
  });
}
