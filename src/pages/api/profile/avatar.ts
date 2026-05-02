import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface AvatarUploadBody {
  base64: string;
  mimeType: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function createAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const authClient = createAuthClient(token);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Parse body
  const { base64, mimeType } = req.body as Partial<AvatarUploadBody>;

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: "base64 and mimeType are required" });
  }

  if (!ACCEPTED_TYPES.includes(mimeType)) {
    return res
      .status(400)
      .json({ error: "Accepted types: image/jpeg, image/png, image/webp" });
  }

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64, "base64");

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return res.status(400).json({ error: "File size must be under 2MB" });
  }

  const ext = extFromMime(mimeType);
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  // Upload using service role client (bypasses storage RLS)
  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[POST /api/profile/avatar] Upload error:", uploadError);
    return res.status(500).json({ error: "Failed to upload avatar" });
  }

  // Get public URL
  const { data: urlData } = serviceClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return res.status(200).json({ url: urlData.publicUrl });
}
