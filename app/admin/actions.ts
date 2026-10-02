"use server";

import { redirect } from "next/navigation";

import { createSessionSupabaseClient } from "@/lib/supabase/session";

/** Mengakhiri sesi dan mengembalikan ke halaman login. */
export async function logoutAction(): Promise<void> {
  const supabase = await createSessionSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
