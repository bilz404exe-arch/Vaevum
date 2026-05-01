import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Creates a per-request Supabase client that authenticates using the user's
 * JWT from the Authorization header. RLS policies enforce data isolation
 * automatically — no manual user_id filtering needed beyond what RLS provides.
 */
function createAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract and validate the Bearer token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseWithAuth = createAuthClient(token);

  // Verify the token by fetching the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return handleDelete(res, user.id);
}

/**
 * DELETE /api/user
 *
 * Disables the authenticated user's Supabase auth account using the service
 * role client (admin privileges required). Per the data retention policy,
 * user data (personas, conversations, messages) is NOT deleted immediately —
 * it is retained for 30 days and purged by an admin via the Supabase dashboard.
 *
 * Returns { success: true } on success.
 */
async function handleDelete(
  res: NextApiResponse<{ success: true } | { error: string }>,
  userId: string,
) {
  const { error } = await supabaseServer.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[DELETE /api/user] Admin auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ success: true });
}
