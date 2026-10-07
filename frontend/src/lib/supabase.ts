import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let hasWarned = false;

const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === "production" && !isMockMode) {
    throw new Error(
      "Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in production."
    );
  } else if (typeof window !== "undefined" && !hasWarned) {
    console.warn(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. Running in mock-mode fallback."
    );
    hasWarned = true;
  }
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "dummy-anon-key",
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: true,
    },
  }
);

/**
 * Resolves the active access token directly from the Supabase session.
 * Does NOT fall back to localStorage.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Supabase session unavailable
  }

  return null;
}
