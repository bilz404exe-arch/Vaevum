import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Persona } from "@/types/index";

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

  if (req.method === "PATCH") {
    return handlePatch(req, res, supabaseWithAuth);
  }

  if (req.method === "DELETE") {
    return handleDelete(req, res, supabaseWithAuth);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

/**
 * PATCH /api/personas/[id]
 * Partially updates a persona for the authenticated user.
 * Only fields present in the request body are updated; also sets updated_at.
 * RLS enforces that only the owner can update their own persona.
 * Returns 404 if no row was updated (persona not found or not owned by user).
 */
async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse<Persona | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid id" });
  }

  // Only pick fields that are present in the request body (partial update)
  const allowedFields = ["name", "role", "gender", "tone", "mode"] as const;
  type AllowedField = (typeof allowedFields)[number];

  const body = req.body as Partial<Record<AllowedField, unknown>>;
  const updates: Partial<Record<AllowedField, unknown>> & {
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (field in body && body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("personas")
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select(
      "id, user_id, name, role, gender, tone, mode, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    // PGRST116 = no rows returned (not found or RLS blocked)
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Persona not found" });
    }
    console.error("[PATCH /api/personas/:id] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  if (!data) {
    return res.status(404).json({ error: "Persona not found" });
  }

  return res.status(200).json(data as Persona);
}

/**
 * DELETE /api/personas/[id]
 * Soft-deletes a persona by setting deleted_at = now().
 * RLS enforces that only the owner can delete their own persona.
 * Returns 404 if no row was updated (persona not found or not owned by user).
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid id" });
  }

  const { data, error } = await supabase
    .from("personas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    // PGRST116 = no rows returned (not found or RLS blocked)
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Persona not found" });
    }
    console.error("[DELETE /api/personas/:id] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  if (!data) {
    return res.status(404).json({ error: "Persona not found" });
  }

  return res.status(200).json({ success: true });
}
