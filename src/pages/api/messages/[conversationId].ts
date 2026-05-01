import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Message, MessagePage } from "@/types/index";

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
 * GET /api/messages/[conversationId]
 *
 * Returns a paginated page of messages for the given conversation.
 *
 * Query params:
 *   cursor  — ISO timestamp string (optional). When provided, fetches messages
 *             older than this timestamp (i.e. created_at < cursor).
 *   limit   — number of messages per page (default 50).
 *
 * Pagination strategy:
 *   - We always query ORDER BY created_at DESC, LIMIT (limit + 1) so we can
 *     detect whether there are more pages without a separate COUNT query.
 *   - The extra row is never returned to the client — it only sets hasMore.
 *   - After fetching, we reverse the array so messages are in ASC order.
 *   - nextCursor is the created_at of the oldest message in the page (first
 *     item after reversing), which the client passes as `cursor` on the next
 *     "load older" request.
 *
 * RLS on the messages table ensures only the owner's rows are returned.
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<MessagePage | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
) {
  const { conversationId } = req.query;

  if (!conversationId || typeof conversationId !== "string") {
    return res.status(400).json({ error: "Missing or invalid conversationId" });
  }

  // Parse and validate query params
  const rawLimit = req.query.limit;
  const limit =
    rawLimit && typeof rawLimit === "string" && !isNaN(Number(rawLimit))
      ? Math.max(1, Math.min(200, Number(rawLimit)))
      : 50;

  const cursor =
    req.query.cursor && typeof req.query.cursor === "string"
      ? req.query.cursor
      : null;

  // Build the query. We fetch limit + 1 rows to determine hasMore.
  // ORDER BY created_at DESC so we get the most recent messages first,
  // then reverse the array to return them in ASC order.
  let query = supabase
    .from("messages")
    .select(
      "id, conversation_id, user_id, role, content, mode_at_time, created_at",
    )
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  // When a cursor is provided, only fetch messages older than the cursor
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/messages/:conversationId] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  const rows = (data ?? []) as Message[];

  // Determine if there are more pages beyond this one
  const hasMore = rows.length > limit;

  // Trim the sentinel row before returning to the client
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // Reverse to restore chronological (ASC) order for the client
  const messages = pageRows.reverse();

  // nextCursor is the created_at of the oldest message in this page
  // (first item after reversing). The client passes this as `cursor` to
  // load the next (older) page.
  const nextCursor = messages.length > 0 ? messages[0].created_at : null;

  return res.status(200).json({ messages, nextCursor, hasMore });
}
