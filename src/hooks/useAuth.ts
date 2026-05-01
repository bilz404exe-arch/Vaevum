import { useState, useEffect } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize state from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes to keep user/session in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Unsubscribe on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthError | null> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  };

  const signUp = async (
    email: string,
    password: string,
  ): Promise<AuthError | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return { user, session, loading, signIn, signUp, signOut };
}
