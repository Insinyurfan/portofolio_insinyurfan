import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/database.types";
import { env } from "@/shared/env";

/**
 * Klien Supabase khusus server, memakai kunci anon.
 *
 * Service role key TIDAK dipakai di mana pun. Memaksa halaman publik melewati
 * RLS yang sama seperti peramban berarti kebocoran kebijakan muncul saat
 * pengembangan, bukan setelah produksi.
 * Lihat design.md → "Klien Supabase anon di server, bukan service role".
 *
 * Impor "server-only" di atas membuat berkas ini gagal di-build kalau ada
 * Client Component yang mengimpornya.
 */
export function createServerSupabaseClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      // Tidak ada sesi yang perlu dijaga di sisi publik.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
