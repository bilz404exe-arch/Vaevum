import { supabase } from "@/lib/supabase";

/**
 * Returns the Authorization header with the current session's access token.
 * Throws if there is no active session.
 */
export async function getAuthHeaders(): Promise<{
  Authorization: string;
  "Content-Type"?: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No active session");
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * fetch wrapper that automatically attaches the Supabase Bearer token.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers ?? {}),
    },
  });
}

/**
 * Truncates a string to at most `n` characters, appending "..." if truncated.
 * Used by PersonaCard for last message previews (60 char limit).
 */
export function truncate(str: string, n: number): string {
  if (str.length <= n) return str;
  return str.slice(0, n) + "...";
}

/**
 * Returns a human-readable relative time string from a Date or ISO string.
 * Examples: "just now", "5m ago", "2h ago", "3d ago", "Jan 15"
 * Used by PersonaCard for "2h ago" timestamps.
 */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  // Older than 7 days: show month + day
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
