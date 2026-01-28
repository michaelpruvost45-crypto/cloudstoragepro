import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase env manquantes. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
