import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabaseClient() {
  if (!client) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase URL or anon key in .env.");
    }

    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.sessionStorage,
      },
    });
  }

  return client;
}
