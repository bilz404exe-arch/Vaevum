import type { AppProps } from "next/app";
import { useEffect } from "react";
import "@/styles/globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

// NOTE: Supabase client is imported lazily to avoid SSR issues with env vars
// The auth state listener is initialized here to keep session in sync globally.

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Apply cursor: none to body (also set in globals.css, but ensure it's applied)
    document.body.style.cursor = "none";

    // Initialize Supabase auth state listener
    // Imported dynamically to avoid SSR issues
    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase").then(({ supabase }) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, _session) => {
        // Auth state is managed by individual hooks (useAuth)
        // This listener ensures the session stays fresh globally
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
