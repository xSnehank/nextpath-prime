"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, Notice, PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { setMockRole } from "@/lib/session";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const isAlreadyRegistered = (message: string) => /already (been )?registered/i.test(message);

function ParentJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  const [inviteCode, setInviteCode] = React.useState(searchParams.get("code") || "");
  const [signedInAs, setSignedInAs] = React.useState<string | null>(null); // a parent already signed in
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [checking, setChecking] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showSignInLink, setShowSignInLink] = React.useState(false);
  const [emailNotice, setEmailNotice] = React.useState("");
  const [linkedWith, setLinkedWith] = React.useState<string | null>(null);

  // A signed-in parent only needs the code; one who's already linked goes on.
  React.useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((me) => {
        if (!active || me.role !== "parent") return;
        if (me.pair) router.replace(me.progress.assessment_complete ? "/dashboard" : "/assessment/parent");
        else setSignedInAs(me.full_name || "you");
      })
      .catch(() => {})
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim();
    setError("");
    setShowSignInLink(false);
    setEmailNotice("");
    if (!code) return setError("Please enter the invite code from your child.");
    if (!signedInAs) {
      if (!name.trim()) return setError("Please enter your name.");
      if (!email.includes("@")) return setError("Please enter a valid email address.");
      if (password.length < 8) return setError("Your password needs at least 8 characters.");
    }

    setLoading(true);
    try {
      if (!signedInAs) {
        if (isMockMode && !isSupabaseConfigured) {
          setMockRole("parent");
        } else {
          const { data, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { role: "parent", full_name: name.trim() } },
          });
          if (authError) {
            if (isAlreadyRegistered(authError.message)) {
              setError("This email already has an account. Sign in, then enter the code again.");
              setShowSignInLink(true);
            } else {
              setError(authError.message);
            }
            return;
          }
          if (isMockMode) setMockRole("parent");
          if (data.user && !data.session) {
            setEmailNotice("Check your email to confirm your account, then sign in and enter the code again.");
            return;
          }
        }
        // Signed in from here on: if linking fails, trying again only repeats the linking.
        setSignedInAs(name.trim() || "you");
      }

      await api.linkParent(code);
      let partner = "your child";
      try {
        const me = await api.getMe();
        if (me.partner?.full_name) partner = me.partner.full_name;
      } catch {
        // keep the generic label
      }
      setLinkedWith(partner);
    } catch (err) {
      if (err instanceof ApiError && err.code === "NOT_FOUND") {
        setError("That invite code isn't valid or has expired. Ask your child for a new one.");
      } else {
        setError(err instanceof Error ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (linkedWith) {
    return (
      <PageShell title="You're linked" subtitle={`You're now connected with ${linkedWith}.`}>
        <Button className="w-full" onClick={() => router.push("/assessment/parent")}>
          Add your budget and choices <ArrowRight className="h-4 w-4" />
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Join your child's plan"
      subtitle={signedInAs ? `Signed in as ${signedInAs}. Enter your child's invite code.` : "Create your parent account with your child's invite code."}
    >
      {checking ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Notice>
              {error}{" "}
              {showSignInLink && (
                <Link href="/signin" className="font-semibold underline underline-offset-2">
                  Sign in
                </Link>
              )}
            </Notice>
          )}
          {emailNotice && <Notice tone="success">{emailNotice}</Notice>}

          <div className="space-y-1.5">
            <FieldLabel htmlFor="code">Invite code</FieldLabel>
            <Input
              id="code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="PRISM-XXXXXXXX"
              className="font-mono uppercase tracking-wider"
              required
            />
          </div>
          {!signedInAs && (
            <>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="name">Your name</FieldLabel>
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
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {signedInAs ? "Link accounts" : "Create account and link"}
          </Button>
          {!signedInAs && (
            <p className="text-center text-sm text-muted-foreground">
              Have an account?{" "}
              <Link href="/signin" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </form>
      )}
    </PageShell>
  );
}

export default function ParentJoinPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted-foreground" />}>
      <ParentJoinContent />
    </Suspense>
  );
}
