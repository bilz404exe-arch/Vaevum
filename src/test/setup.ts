import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Supabase client for all tests
// This prevents real network calls and env var requirements during testing
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Suppress console.error for expected test errors
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});
