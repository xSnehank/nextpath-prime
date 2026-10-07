"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Link2, ShieldCheck, Loader2, AlertCircle, KeyRound, User } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";

function ParentJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read code from ?code= ONLY with NO default (Comment 6/14)
  const initialCode = searchParams.get("code") || "";
  const [inviteCode, setInviteCode] = React.useState(initialCode);

  // Parent authentication state (Item 1b)
  const [authMode, setAuthMode] = React.useState<"signup" | "signin">("signup");
  const [parentName, setParentName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailNotice, setEmailNotice] = React.useState("");

  const [isLinked, setIsLinked] = React.useState(false);
  const [linkedInfo, setLinkedInfo] = React.useState<{
    studentId: string;
    parentId: string;
    linkedAt: string;
    partnerLabel: string;
  } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setError("Please enter the invite code provided by your child.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (authMode === "signup" && !parentName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");
    setEmailNotice("");

    try {
      // 1. Authenticate parent with role "parent" (Item 1b)
      if (authMode === "signup") {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: "parent",
              full_name: parentName,
            },
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        // Record per-tab mock role fallback (Item 1e)
        sessionStorage.setItem("prism_mock_role", "parent");

        // 2. Email confirmation check (Item 1c)
        if (authData.user && !authData.session) {
          setEmailNotice("Check your email to confirm your account, then sign in");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        // Record per-tab mock role fallback (Item 1e)
        sessionStorage.setItem("prism_mock_role", "parent");
      }

      // 3. Link parent account using invite code (POST /auth/link)
      const res = await api.linkParent(cleanCode);

      // Clean up legacy keys (Item 13b)
      localStorage.removeItem("prism_dev_user");
      localStorage.removeItem("prism_profiles_linked");

      // 4. Discover partner label (Item 5b: no "Aarav Sharma", show "your child")
      let partnerLabel = "your child";
      try {
        const me = await api.getMe();
        if (me.partner && (me.partner as unknown as { full_name?: string }).full_name) {
          partnerLabel = (me.partner as unknown as { full_name: string }).full_name;
        }
      } catch {
        // fallback
      }

      setLinkedInfo({
        studentId: res.student_id,
        parentId: res.parent_id,
        linkedAt: res.linked_at,
        partnerLabel,
      });
      setIsLinked(true);
    } catch (err: unknown) {
      console.error("Linking failed:", err);
      if (err instanceof ApiError) {
        if (err.code === "NOT_FOUND") {
          setError("The invite code is invalid or has expired. Please ask your child for a new code.");
        } else if (err.code === "VALIDATION_ERROR") {
          setError("Please check the invite code format.");
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to connect to the backend server. Please check your network.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Parent Account Linking</Badge>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  authMode === "signup"
                    ? "bg-cyan-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  authMode === "signin"
                    ? "bg-cyan-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
            </div>
          </div>
          <CardTitle className="text-2xl pt-2">
            {authMode === "signup" ? "Join via Student Invite" : "Sign In & Link Account"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Create or access your parent account and link with your child using their unique invite code.
          </CardDescription>
        </CardHeader>

        {isLinked && linkedInfo ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-emerald-200">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Successfully Linked with {linkedInfo.partnerLabel}!</span>
              </div>
              <p className="text-xs text-slate-300">
                Your parent profile is now paired. Complete your financial calibration form to solve tuition affordability and generate the joint roadmap.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push("/assessment/parent")}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <span>Proceed to Parent Calibration</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLink}>
            <CardContent className="space-y-4">
              {emailNotice && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium">
                  {emailNotice}
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Invite Code Box */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Student Invite Code</span>
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. PRISM-8X2A9"
                  className="font-mono tracking-widest text-cyan-300 uppercase"
                  disabled={loading}
                  required
                />
              </div>

              {/* Parent Auth Details */}
              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Parent Full Name</span>
                  </label>
                  <Input
                    placeholder="e.g. Rajesh Sharma"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Parent Email Address
                </label>
                <Input
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Confidential pairing. Your financial data is protected by dual consent.</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {authMode === "signup" ? "Already registered? Sign in" : "Need an account? Sign up"}
              </button>

              <Button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>{authMode === "signup" ? "Sign Up & Link" : "Sign In & Link"}</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ParentJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <ParentJoinContent />
    </Suspense>
  );
}
