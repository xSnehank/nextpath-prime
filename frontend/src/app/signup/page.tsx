"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, School, MapPin, Loader2, KeyRound, Globe, Compass } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { IndianState, StudentProfile } from "@/types/api";

const INDIAN_STATES: IndianState[] = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GRADES = [
  "Grade 9 (Foundation)",
  "Grade 10 (Board Year)",
  "Grade 11 - Science (PCM)",
  "Grade 11 - Science (PCB)",
  "Grade 11 - Commerce",
  "Grade 11 - Humanities / Arts",
  "Grade 12 - Science (PCM)",
  "Grade 12 - Science (PCB)",
  "Grade 12 - Commerce",
  "Grade 12 - Humanities / Arts",
  "College 1st / 2nd Year Undergrad",
];

export default function SignupPage() {
  const router = useRouter();

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  // Auth mode: "signup" or "signin" (Item 1a)
  const [authMode, setAuthMode] = React.useState<"signup" | "signin">("signup");

  // Form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [grade, setGrade] = React.useState(GRADES[2]);
  const [homeState, setHomeState] = React.useState<IndianState>("Maharashtra");

  // Explicit Student Preferences (Item 4a: risk 1-5, preferred_state, open_to_abroad)
  const [riskAppetite, setRiskAppetite] = React.useState<number>(3);
  const [preferredState, setPreferredState] = React.useState<IndianState>("Maharashtra");
  const [openToAbroad, setOpenToAbroad] = React.useState<boolean>(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [emailNotice, setEmailNotice] = React.useState("");

  // Item 1g: Show quick-fill ONLY in mock mode, labelled "Fill sample data"
  const handleFillSampleData = () => {
    setName("Aarav Sharma");
    setEmail("aarav.demo@example.com");
    setPassword("PrismPass123!");
    setGrade(GRADES[2]);
    setHomeState("Maharashtra");
    setPreferredState("Karnataka");
    setRiskAppetite(4);
    setOpenToAbroad(true);
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setEmailNotice("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Record per-tab mock role fallback (Item 1e)
      sessionStorage.setItem("prism_mock_role", "student");

      router.push("/assessment/student");
    } catch (err: unknown) {
      console.error("Sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setEmailNotice("");

    if (!name.trim()) {
      setError("Please enter your full name.");
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

    setLoading(true);

    try {
      // 1. Create Supabase account with role: student (Item 1a)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "student",
            full_name: name,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Record per-tab mock role fallback (Item 1e)
      sessionStorage.setItem("prism_mock_role", "student");

      // 2. Email confirmation check (Item 1c)
      if (authData.user && !authData.session) {
        setEmailNotice("Check your email to confirm your account, then sign in");
        return;
      }

      // 3. Save student profile via PUT /profile with student's real choices (Item 4a, 4b, 4c)
      const studentProfile: StudentProfile = {
        role: "student",
        risk_appetite: riskAppetite,
        preferred_state: preferredState,
        home_state: homeState,
        open_to_abroad: openToAbroad,
      };

      await api.updateProfile(studentProfile);

      // 4. Create invite code via POST /auth/invite (Item 4c: no swallowing errors)
      const invite = await api.createInvite();
      if (invite?.invite_code) {
        localStorage.setItem("prism_parent_invite_code", invite.invite_code);
      }

      // Clean up legacy keys (Item 13b)
      localStorage.removeItem("prism_dev_user");
      localStorage.removeItem("prism_student_name");
      localStorage.removeItem("prism_parent_name");

      router.push("/assessment/student");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details?.fields && Array.isArray(err.details.fields)) {
          const fieldMap: Record<string, string> = {};
          for (const f of err.details.fields as Array<{ field: string; issue: string }>) {
            if (f.field && f.issue) fieldMap[f.field] = f.issue;
          }
          setFieldErrors(fieldMap);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create student account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Student Account</Badge>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  authMode === "signup"
                    ? "bg-violet-600 text-white font-medium"
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
                    ? "bg-violet-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
            </div>
          </div>
          <CardTitle className="text-2xl pt-2">
            {authMode === "signup" ? "Create Student Profile" : "Sign In to NextPath"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {authMode === "signup"
              ? "Calibrate entrance exam milestones, state quota schemes, and psychometric baseline vectors."
              : "Access your saved assessments, parent pairing, and career roadmap."}
          </CardDescription>
        </CardHeader>

        {authMode === "signin" ? (
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="student@school.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                  <span>Password</span>
                </label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Need an account? Sign up
              </button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {emailNotice && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium">
                  {emailNotice}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Item 1g: Show sample fill ONLY in mock mode */}
              {isMockMode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                  <span className="text-slate-400">Mock mode active</span>
                  <button
                    type="button"
                    onClick={handleFillSampleData}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
                  >
                    Fill sample data
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name
                </label>
                <Input
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="student@school.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-violet-400" />
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-violet-400" />
                  <span>Current Academic Stage</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* State of Residence */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Home State / Domicile</span>
                </label>
                <select
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value as IndianState)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.home_state && (
                  <p className="text-[10px] text-rose-400">{fieldErrors.home_state}</p>
                )}
              </div>

              {/* Item 4a: Preferred State */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Preferred State to Study and Work</span>
                </label>
                <select
                  value={preferredState}
                  onChange={(e) => setPreferredState(e.target.value as IndianState)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.preferred_state && (
                  <p className="text-[10px] text-rose-400">{fieldErrors.preferred_state}</p>
                )}
              </div>

              {/* Item 4a: Risk Comfort (1-5) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">
                    How comfortable are you with risk? (1 = Low, 5 = High)
                  </span>
                  <span className="font-mono font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded">
                    {riskAppetite} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRiskAppetite(lvl)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                        riskAppetite === lvl
                          ? "bg-violet-600 border-violet-400 text-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                {fieldErrors.risk_appetite && (
                  <p className="text-[10px] text-rose-400">{fieldErrors.risk_appetite}</p>
                )}
              </div>

              {/* Item 4a: Open to Studying Abroad (yes/no) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Open to studying abroad?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenToAbroad(true)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      openToAbroad
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    Yes, open to abroad
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenToAbroad(false)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      !openToAbroad
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    No, India only
                  </button>
                </div>
                {fieldErrors.open_to_abroad && (
                  <p className="text-[10px] text-rose-400">{fieldErrors.open_to_abroad}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>We never sell student data. Used solely for deterministic guidance models.</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign in instead
              </button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <span>Begin Diagnostic</span>
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
