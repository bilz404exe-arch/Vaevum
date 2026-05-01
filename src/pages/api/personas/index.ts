import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Persona, CreatePersonaInput } from "@/types/index";

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

  if (req.method === "GET") {
    return handleGet(req, res, supabaseWithAuth);
  }

  if (req.method === "POST") {
    return handlePost(req, res, supabaseWithAuth, user.id);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

/**
 * GET /api/personas
 * Returns all active (non-deleted) personas for the authenticated user,
 * ordered by last_active DESC (via join with conversations), falling back
 * to created_at DESC when no conversation exists.
 */
async function handleGet(
  _req: NextApiRequest,
  res: NextApiResponse<Persona[] | { error: string }>,
  supabase: ReturnType<typeof createAuthClient>,
) {
  // Join with conversations to get last_active for sorting.
  // RLS on personas ensures only the authenticated user's rows are returned.
  const { data, error } = await supabase
    .from("personas")
    .select(
      `
      id,
      user_id,
      name,
      role,
      gender,
      tone,
      mode,
      created_at,
      updated_at,
      deleted_at,
      conversations (
        last_active
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/personas] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  // Sort by the most recent conversation's last_active, falling back to
  // created_at for personas that have no conversation yet.
  const personas = (data ?? [])
    .map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convs = (row as any).conversations as Array<{
        last_active: string;
      }> | null;
      const lastActive =
        convs && convs.length > 0
          ? convs.reduce((latest, c) =>
              c.last_active > latest.last_active ? c : latest,
            ).last_active
          : null;

      return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        role: row.role,
        gender: row.gender,
        tone: row.tone,
        mode: row.mode,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        _lastActive: lastActive ?? row.created_at,
      };
    })
    .sort((a, b) => (a._lastActive < b._lastActive ? 1 : -1))
    .map(({ _lastActive: _la, ...persona }) => persona as Persona);

  return res.status(200).json(personas);
}

/**
 * POST /api/personas
 * Creates a new persona for the authenticated user.
 * Required fields: name, role, gender, tone, mode.
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<Persona | { error: string; details?: string }>,
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
) {
  const body = req.body as Partial<CreatePersonaInput>;

  const requiredFields: Array<keyof CreatePersonaInput> = [
    "name",
    "role",
    "gender",
    "tone",
    "mode",
  ];

  const missingFields = requiredFields.filter(
    (field) => !body[field] || String(body[field]).trim() === "",
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Bad request",
      details: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const { data, error } = await supabase
    .from("personas")
    .insert({
      user_id: userId,
      name: body.name!.trim(),
      role: body.role!,
      gender: body.gender!,
      tone: body.tone!,
      mode: body.mode!,
    })
    .select(
      "id, user_id, name, role, gender, tone, mode, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    console.error("[POST /api/personas] DB error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(201).json(data as Persona);
}
