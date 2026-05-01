import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Message } from "@/types/index";

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
  if (req.method !== "POST") {
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

  return handlePost(req, res, supabaseWithAuth, user.id);
}

/**
 * POST /api/messages
 *
 * Inserts a new message into the messages table.
 *
 * Body:
 *   conversation_id  — UUID of the conversation (required)
 *   role             — 'user' or 'assistant' (required)
 *   content          — message text (required)
 *   mode_at_time     — ContentMode string at the time of the message (optional)
 *
 * Returns the created Message with 201 status.
 * RLS on the messages table ensures the row is owned by the authenticated user.
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<Message | { error: string; details?: string }>,
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
) {
  const body = req.body as {
    conversation_id?: string;
    role?: string;
    content?: string;
    mode_at_time?: string;
  };

  // Validate required fields
  if (!body.conversation_id || String(body.conversation_id).trim() === "") {
    return res.status(400).json({
      error: "Bad request",
      details: "Missing required field: conversation_id",
    });
  }

  if (!body.role || (body.role !== "user" && body.role !== "assistant")) {
    return res.status(400).json({
      error: "Bad request",
      details: "Field 'role' must be 'user' or 'assistant'",
    });
  }

  if (!body.content || String(body.content).trim() === "") {
    return res.status(400).json({
      error: "Bad request",
      details: "Missing required field: content",
    });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: body.conversation_id,
      user_id: userId,
      role: body.role as "user" | "assistant",
      content: body.content,
      mode_at_time: body.mode_at_time ?? null,
    })
    .select(
      "id, conversation_id, user_id, role, content, mode_at_time, created_at",
    )
    .single();

  if (error) {
    console.error("[POST /api/messages] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(201).json(data as Message);
}
