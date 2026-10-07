"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogIn, AlertCircle, Loader2, UserCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const routeUserByProgress = (me: {
    role: "student" | "parent";
    pair?: unknown;
    progress?: {
      profile_complete?: boolean;
      assessment_complete?: boolean;
    };
  }) => {
    if (me.role === "student") {
      if (!me.progress?.profile_complete) {
        router.push("/onboarding");
      } else if (!me.progress?.assessment_complete) {
        router.push("/assessment/student");
      } else {
        router.push("/dashboard");
      }
    } else {
      if (!me.pair) {
        router.push("/parent/join");
      } else if (!me.progress?.assessment_complete) {
        router.push("/assessment/parent");
      } else {
        router.push("/dashboard");
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }
      }

      // 1. Fetch authenticated user profile
      const me = await api.getMe();

      // 2. Set per-tab mock role dynamically from me.role in mock mode (Comment 4)
      if (isMockMode) {
        sessionStorage.setItem("prism_mock_role", me.role);
      }

      // 3. Route based on role and progress (Comment 4)
      routeUserByProgress(me);
    } catch (err: unknown) {
      console.error("Sign-in failed:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sign-in failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: "student" | "parent") => {
    setLoading(true);
    setError("");

    try {
      sessionStorage.setItem("prism_mock_role", role);
      const me = await api.getMe();
      routeUserByProgress(me);
    } catch (err: unknown) {
      console.error("Mock sign-in failed:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to initialize mock session.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Unified Sign In</Badge>
            <span className="text-xs text-slate-400">PRISM Engine</span>
          </div>
          <CardTitle className="text-2xl pt-2">Welcome Back</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Sign in to access your calibrated assessment roadmap, family link, and trade-off solver.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mock Mode Quick Login (Comment 5) */}
            {isMockMode && !isSupabaseConfigured && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  <span>Mock Mode (Local Testing)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Supabase is unconfigured locally. Choose a demo identity to continue:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoSignIn("student")}
                    disabled={loading}
                    className="text-xs border-violet-500/30 text-violet-300 hover:bg-violet-950/40"
                  >
                    Demo Student
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoSignIn("parent")}
                    disabled={loading}
                    className="text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
                  >
                    Demo Parent
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            <div className="text-center text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-cyan-400 hover:underline">
                Sign up as student
              </Link>
              {" · "}
              <Link href="/parent/join" className="text-cyan-400 hover:underline">
                Join as parent
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
