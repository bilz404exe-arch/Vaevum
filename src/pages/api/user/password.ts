import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

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
  if (req.method !== "PATCH") {
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

  return handlePatch(req, res, supabaseWithAuth);
}

/**
 * PATCH /api/user/password
 *
 * Updates the authenticated user's password.
 *
 * Body:
 *   newPassword  — the new password string (required, minimum 8 characters)
 *
 * Returns { success: true } on success.
 */
async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
) {
  const { newPassword } = req.body as { newPassword?: string };

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: "newPassword is required and must be at least 8 characters",
    });
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("[PATCH /api/user/password] Auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ success: true });
}
