"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Klien Supabase untuk peramban — hanya dipakai form login.
 *
 * Sesi disimpan di cookie (bukan localStorage) supaya proxy dan Server
 * Component bisa membacanya. Lihat design.md → "Sesi berbasis cookie".
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
