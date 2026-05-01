import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Conversation } from "@/types/index";

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
  if (req.method !== "GET") {
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

  return handleGet(req, res, supabaseWithAuth, user.id);
}

/**
 * GET /api/conversations/[personaId]
 * Returns the active conversation for the authenticated user and the given
 * persona. If no conversation exists yet, one is created automatically.
 * RLS enforces that only the owner can read/write their own conversations.
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<Conversation | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
) {
  const { personaId } = req.query;

  if (!personaId || typeof personaId !== "string") {
    return res.status(400).json({ error: "Missing or invalid personaId" });
  }

  // Look for an existing active conversation for this user + persona pair
  const { data: existing, error: selectError } = await supabase
    .from("conversations")
    .select(
      "id, user_id, persona_id, created_at, last_message, last_active, deleted_at",
    )
    .eq("persona_id", personaId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[GET /api/conversations/:personaId] DB select error:",
      selectError,
    );
    return res.status(500).json({ error: "Internal server error" });
  }

  if (existing) {
    return res.status(200).json(existing as Conversation);
  }

  // No conversation found — create one now
  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      persona_id: personaId,
      last_active: new Date().toISOString(),
    })
    .select(
      "id, user_id, persona_id, created_at, last_message, last_active, deleted_at",
    )
    .single();

  if (insertError) {
    console.error(
      "[GET /api/conversations/:personaId] DB insert error:",
      insertError,
    );
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json(created as Conversation);
}
