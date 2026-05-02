import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "free" | "active" | "canceled" | "past_due";
  plan: "free" | "premium";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

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
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabaseWithAuth = createAuthClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser();
  if (authError || !user)
    return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabaseWithAuth
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Internal server error" });

  // Return free plan if no subscription record exists yet
  if (!data) {
    return res.status(200).json({
      plan: "free",
      status: "free",
      current_period_end: null,
    });
  }

  return res.status(200).json(data as Subscription);
}
