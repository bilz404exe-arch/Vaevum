import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  instagram_username: string | null;
  instagram_password: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_FIELDS =
  "id, user_id, username, display_name, avatar_url, instagram_username, instagram_password, created_at, updated_at";

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
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabaseWithAuth = createAuthClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser();
  if (authError || !user)
    return res.status(401).json({ error: "Unauthorized" });

  // ─── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabaseWithAuth
      .from("profiles")
      .select(SELECT_FIELDS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: "Internal server error" });
    if (!data) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(data as Profile);
  }

  // ─── POST ─────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { username, display_name, instagram_username, instagram_password } =
      req.body as {
        username?: string;
        display_name?: string;
        instagram_username?: string;
        instagram_password?: string;
      };

    if (!username || username.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: "Username can only contain letters, numbers, and underscores",
      });
    }

    const { data, error } = await supabaseWithAuth
      .from("profiles")
      .insert({
        user_id: user.id,
        username: username.trim().toLowerCase(),
        display_name: display_name ?? null,
        instagram_username: instagram_username ?? null,
        instagram_password: instagram_password ?? null,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (error.code === "23505")
        return res.status(409).json({ error: "Username already taken" });
      return res.status(500).json({ error: "Internal server error" });
    }
    return res.status(201).json(data as Profile);
  }

  // ─── PATCH ────────────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const {
      username,
      display_name,
      avatar_url,
      instagram_username,
      instagram_password,
    } = req.body as {
      username?: string;
      display_name?: string;
      avatar_url?: string;
      instagram_username?: string;
      instagram_password?: string;
    };

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) {
      if (username.trim().length < 3)
        return res
          .status(400)
          .json({ error: "Username must be at least 3 characters" });
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res.status(400).json({
          error: "Username can only contain letters, numbers, and underscores",
        });
      updates.username = username.trim().toLowerCase();
    }
    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (instagram_username !== undefined)
      updates.instagram_username = instagram_username;
    if (instagram_password !== undefined)
      updates.instagram_password = instagram_password;

    const { data, error } = await supabaseWithAuth
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (error.code === "23505")
        return res.status(409).json({ error: "Username already taken" });
      return res.status(500).json({ error: "Internal server error" });
    }
    return res.status(200).json(data as Profile);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
