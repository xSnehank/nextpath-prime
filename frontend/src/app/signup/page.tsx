"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, Notice, PageShell } from "@/components/PageShell";
import { setMockRole } from "@/lib/session";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const isAlreadyRegistered = (message: string) => /already (been )?registered/i.test(message);

/** Student sign-up: the account only. Preferences are asked next, on /onboarding. */
export default function SignupPage() {
  const router = useRouter();
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showSignInLink, setShowSignInLink] = React.useState(false);
  const [emailNotice, setEmailNotice] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowSignInLink(false);
    setEmailNotice("");

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Your password needs at least 8 characters.");

    // Mock mode without Supabase: act as the demo student.
    if (isMockMode && !isSupabaseConfigured) {
      setMockRole("student");
      router.push("/onboarding");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role: "student", full_name: name.trim() } },
      });
      if (authError) {
        if (isAlreadyRegistered(authError.message)) {
          setError("This email already has an account.");
          setShowSignInLink(true);
        } else {
          setError(authError.message);
        }
        return;
      }
      if (isMockMode) setMockRole("student");
      if (data.user && !data.session) {
        setEmailNotice("Check your email to confirm your account, then sign in.");
        return;
      }
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Create your student account" subtitle="Next, a few quick choices and a short assessment.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Notice>
            {error}{" "}
            {showSignInLink && (
              <Link href="/signin" className="font-semibold underline underline-offset-2">
                Sign in instead
              </Link>
            )}
          </Notice>
        )}
        {emailNotice && <Notice tone="success">{emailNotice}</Notice>}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Have an account?{" "}
          <Link href="/signin" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/parent/join" className="font-medium text-accent hover:underline">
            I&apos;m a parent
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
