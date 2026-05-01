import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  groq,
  GROQ_MODEL,
  GROQ_MAX_TOKENS,
  GROQ_TEMPERATURE,
} from "@/lib/groq";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { truncate } from "@/lib/utils";
import type { ChatRequest, ChatResponse } from "@/types";

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
 * POST /api/chat
 *
 * Accepts a ChatRequest, calls the Groq API with the full conversation
 * history, persists both the user and assistant messages, and returns
 * a ChatResponse with the AI content and the new assistant message ID.
 *
 * Error handling:
 *   - Groq failure  → 502 { error: 'AI service unavailable' }
 *   - DB save failure → log error, return AI response anyway (do not block chat)
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
) {
  const body = req.body as Partial<ChatRequest>;

  // Validate required fields
  if (
    !body.conversationId ||
    !body.message ||
    !body.persona ||
    !body.currentMode
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: conversationId, message, persona, and currentMode are all required",
    });
  }

  const { conversationId, message, persona, currentMode } = body as ChatRequest;

  // Build the system prompt from the persona and current mode
  const systemPrompt = buildSystemPrompt(persona, currentMode);

  // Fetch full conversation history ordered chronologically
  const { data: historyRows, error: historyError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error(
      "[POST /api/chat] Failed to fetch conversation history:",
      historyError,
    );
    // Non-fatal: proceed with empty history rather than blocking the request
  }

  const history = (historyRows ?? []) as Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;

  // Call the Groq API with system prompt + full history + new user message
  let assistantContent: string;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: GROQ_MAX_TOKENS,
      temperature: GROQ_TEMPERATURE,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
    });

    assistantContent = completion.choices[0]?.message?.content ?? "";
  } catch (groqError) {
    console.error("[POST /api/chat] Groq API error:", groqError);
    return res.status(502).json({ error: "AI service unavailable" });
  }

  // Persist user message and assistant message.
  // DB failures are non-fatal — we return the AI response regardless.
  let assistantMessageId = "";

  try {
    // INSERT user message
    const { error: userInsertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: message,
      mode_at_time: currentMode,
    });

    if (userInsertError) {
      console.error(
        "[POST /api/chat] Failed to insert user message:",
        userInsertError,
      );
    }

    // INSERT assistant message
    const { data: assistantMessage, error: assistantInsertError } =
      await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: assistantContent,
          mode_at_time: currentMode,
        })
        .select("id")
        .single();

    if (assistantInsertError) {
      console.error(
        "[POST /api/chat] Failed to insert assistant message:",
        assistantInsertError,
      );
    } else {
      assistantMessageId = assistantMessage?.id ?? "";
    }

    // UPDATE conversation metadata
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message: truncate(assistantContent, 60),
        last_active: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "[POST /api/chat] Failed to update conversation metadata:",
        updateError,
      );
    }
  } catch (dbError) {
    // Catch any unexpected DB errors — do not block the chat response
    console.error("[POST /api/chat] Unexpected DB error:", dbError);
  }

  return res.status(200).json({
    content: assistantContent,
    messageId: assistantMessageId,
  });
}
