import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Conversation } from "@/types/index";

function createAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabaseWithAuth = createAuthClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser();
  if (authError || !user)
    return res.status(401).json({ error: "Unauthorized" });

  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== "string") {
    return res.status(400).json({ error: "Missing conversationId" });
  }

  const { data, error } = await supabaseWithAuth
    .from("conversations")
    .select(
      "id, user_id, persona_id, created_at, last_message, last_active, deleted_at",
    )
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  return res.status(200).json(data as Conversation);
}
