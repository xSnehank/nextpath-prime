"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, Notice, PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { setMockRole } from "@/lib/session";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { MeResponse } from "@/types/api";

/** Where each person continues: the first step they haven't finished. */
function nextStep(me: MeResponse): string {
  if (me.role === "student") {
    if (!me.progress.profile_complete) return "/onboarding";
    if (!me.progress.assessment_complete) return "/assessment/student";
    return "/dashboard";
  }
  if (!me.pair) return "/parent/join";
  if (!me.progress.assessment_complete) return "/assessment/parent";
  return "/dashboard";
}

export default function SignInPage() {
  const router = useRouter();
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const continueAs = async () => {
    const me = await api.getMe();
    if (isMockMode) setMockRole(me.role);
    router.push(nextStep(me));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Please enter your email and password.");
    setLoading(true);
    setError("");
    try {
      if (isSupabaseConfigured) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) return setError(authError.message);
      }
      await continueAs();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Mock mode without Supabase: there are no real accounts, so pick the demo student or parent.
  const continueAsDemo = async (role: "student" | "parent") => {
    setLoading(true);
    setError("");
    try {
      setMockRole(role);
      await continueAs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Sign in" subtitle="You'll continue where you left off.">
      {isMockMode && !isSupabaseConfigured ? (
        <div className="space-y-3">
          {error && <Notice>{error}</Notice>}
          <Notice tone="info">Mock mode: sign-in isn&apos;t set up, so continue as the sample family.</Notice>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={loading} onClick={() => continueAsDemo("student")}>
              Demo Student
            </Button>
            <Button variant="outline" disabled={loading} onClick={() => continueAsDemo("parent")}>
              Demo Parent
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice>{error}</Notice>}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Student sign-up
        </Link>
        {" · "}
        <Link href="/parent/join" className="font-medium text-accent hover:underline">
          Parent with a code
        </Link>
      </p>
    </PageShell>
  );
}
