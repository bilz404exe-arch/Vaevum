import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UseRequireAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Client-side auth guard hook for protected pages.
 *
 * Checks the current Supabase session on mount. If no session is found
 * after the check completes, redirects the user to `/auth`.
 *
 * Usage:
 *   const { user, loading } = useRequireAuth();
 *   if (loading) return null; // or a loading spinner
 *
 * Protected pages: /builder, /dashboard, /chat/[id], /settings
 */
export function useRequireAuth(): UseRequireAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        router.replace("/auth");
      }
    });
  }, [router]);

  return { user, session, loading };
}
