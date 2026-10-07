"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Link2, ShieldCheck, Loader2, AlertCircle, KeyRound, User, UserCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function ParentJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  // Read code from ?code= ONLY with NO default
  const initialCode = searchParams.get("code") || "";
  const [inviteCode, setInviteCode] = React.useState(initialCode);

  // Authenticated state check (Comment 4)
  const [alreadySignedInUser, setAlreadySignedInUser] = React.useState<{
    role: string;
    full_name?: string | null;
  } | null>(null);

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
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function checkExistingAuth() {
      try {
        const me = await api.getMe();
        if (!active) return;
        if (me.role === "parent") {
          if (me.pair) {
            router.replace(!me.progress?.assessment_complete ? "/assessment/parent" : "/dashboard");
            return;
          }
          setAlreadySignedInUser({ role: me.role, full_name: me.full_name });
        }
      } catch {
        // Not signed in
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    checkExistingAuth();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setError("Please enter the invite code provided by your child.");
      return;
    }

    if (!alreadySignedInUser) {
      if (!parentName.trim()) {
        setError("Please enter your name.");
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
    }

    setLoading(true);
    setError("");
    setEmailNotice("");

    try {
      // 1. Authenticate parent if not already signed in (Comment 4, 5)
      if (!alreadySignedInUser) {
        if (isMockMode && !isSupabaseConfigured) {
          sessionStorage.setItem("prism_mock_role", "parent");
        } else {
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

          if (isMockMode) {
            sessionStorage.setItem("prism_mock_role", "parent");
          }

          if (authData.user && !authData.session) {
            setEmailNotice("Check your email to confirm your account, then sign in");
            return;
          }
        }
      }

      // 2. Link parent account using invite code (POST /auth/link)
      const res = await api.linkParent(cleanCode);

      // Clean up legacy keys
      localStorage.removeItem("prism_dev_user");
      localStorage.removeItem("prism_profiles_linked");

      // 3. Discover partner label
      let partnerLabel = "your child";
      try {
        const me = await api.getMe();
        if (me.partner?.full_name) {
          partnerLabel = me.partner.full_name;
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

  if (checkingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-7 w-7 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Parent Account Linking</Badge>
            {!alreadySignedInUser && (
              <Link
                href="/signin"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors"
              >
                Sign In Instead
              </Link>
            )}
          </div>
          <CardTitle className="text-2xl pt-2">Join via Student Invite</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {alreadySignedInUser
              ? `Signed in as ${alreadySignedInUser.full_name || "Parent"}. Enter your child's invite code to complete pairing.`
              : "Create your parent account and link with your child using their unique invite code."}
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
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium space-y-2">
                  <p className="font-semibold text-white">{emailNotice}</p>
                  <p className="text-[11px] text-slate-300">
                    Once verified, sign in to link with your child.
                  </p>
                  <div className="pt-1">
                    <Link href="/signin">
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
                        Go to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Already Signed In Notice (Comment 4) */}
              {alreadySignedInUser && (
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center gap-2 text-xs text-cyan-300">
                  <UserCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    Logged in as <strong>{alreadySignedInUser.full_name || "Parent"}</strong>
                  </span>
                </div>
              )}

              {/* Invite Code Box */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Student Invite Code <span className="text-rose-400">*</span></span>
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. PRISM-8X2A9"
                  className="font-mono tracking-widest text-cyan-300 uppercase text-center text-lg py-5"
                  disabled={loading}
                  required
                />
              </div>

              {/* Only prompt for credentials if not signed in */}
              {!alreadySignedInUser && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Parent Full Name <span className="text-rose-400">*</span></span>
                    </label>
                    <Input
                      placeholder="e.g. Rajesh Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Parent Email Address <span className="text-rose-400">*</span>
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
                      <span>Password (At least 8 characters) <span className="text-rose-400">*</span></span>
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
                </>
              )}

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Confidential pairing. Your financial data is protected by dual consent.</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
              {!alreadySignedInUser ? (
                <Link
                  href="/signin"
                  className="text-xs text-slate-400 hover:text-white transition-colors order-2 sm:order-1"
                >
                  Already have an account? Sign In
                </Link>
              ) : (
                <span className="text-xs text-slate-400 order-2 sm:order-1">Single-step pairing</span>
              )}

              <Button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>Link Family Profile</span>
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
