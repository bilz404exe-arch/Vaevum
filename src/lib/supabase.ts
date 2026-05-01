import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
  );
}

/**
 * Supabase browser client.
 * Use this in all React components, hooks, and client-side code.
 * Initialized with the public anon key — RLS enforces data security.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
