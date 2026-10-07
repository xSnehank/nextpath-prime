"use client";

import * as React from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const MOCK_ROLE_KEY = "prism_mock_role";
const AUTH_EVENT = "prism-auth";

// Mock mode without Supabase: "signed in" means a demo role was picked (see /signin and /signup).
function subscribeMock(onChange: () => void) {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function mockSignedIn() {
  try {
    return sessionStorage.getItem(MOCK_ROLE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Whether someone is signed in: their Supabase session, or a demo role in mock mode. */
export function useSignedIn(): boolean {
  const mock = React.useSyncExternalStore(subscribeMock, mockSignedIn, () => false);
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(Boolean(session)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return isSupabaseConfigured ? hasSession : mock;
}

/** Mock mode: act as the demo student or parent from now on in this tab. */
export function setMockRole(role: "student" | "parent"): void {
  try {
    sessionStorage.setItem(MOCK_ROLE_KEY, role);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) await supabase.auth.signOut();
  try {
    sessionStorage.removeItem(MOCK_ROLE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}
