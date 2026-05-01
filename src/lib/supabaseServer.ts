import { createClient } from "@supabase/supabase-js";

// IMPORTANT: This module is server-side only.
// Never import this file from any client-side code (components, hooks, pages).
// The service role key bypasses RLS — it must never be exposed to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase server environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

/**
 * Supabase server client (service role).
 * Use ONLY in Next.js API routes (src/pages/api/).
 * This client bypasses RLS — never expose it to the browser.
 */
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
