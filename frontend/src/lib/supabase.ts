import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
  },
});

/**
 * Resolves the active access token:
 * 1. Checks Supabase session if available.
 * 2. Falls back to localStorage.getItem("prism_token").
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Supabase auth session unavailable
  }

  return localStorage.getItem("prism_token");
}
