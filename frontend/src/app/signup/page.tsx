"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Compass, Globe, KeyRound, Loader2, MapPin, School, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
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

  // Form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [grade, setGrade] = React.useState(GRADES[2]);

  // Comment 7: Preferences start empty/unselected
  const [homeState, setHomeState] = React.useState<IndianState | "">("");
  const [preferredState, setPreferredState] = React.useState<IndianState | "">("");
  const [riskAppetite, setRiskAppetite] = React.useState<number | null>(null);
  const [openToAbroad, setOpenToAbroad] = React.useState<boolean | null>(null);

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

  const canSubmit = Boolean(
    name.trim() &&
    email.trim() &&
    password.length >= 8 &&
    homeState &&
    preferredState &&
    riskAppetite !== null &&
    openToAbroad !== null
  );

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
    if (!homeState || !preferredState || riskAppetite === null || openToAbroad === null) {
      setError("Please select all required preference fields.");
      return;
    }

    setLoading(true);

    try {
      // Pending preferences recorded for onboarding / session recovery (Comment 1)
      const preferencesToSave = {
        home_state: homeState,
        preferred_state: preferredState,
        risk_appetite: riskAppetite,
        open_to_abroad: openToAbroad,
      };
      sessionStorage.setItem("prism_pending_preferences", JSON.stringify(preferencesToSave));

      // Mock mode fallback when Supabase is unconfigured (Comment 5)
      if (isMockMode && !isSupabaseConfigured) {
        sessionStorage.setItem("prism_mock_role", "student");
        const studentProfile: StudentProfile = {
          role: "student",
          risk_appetite: riskAppetite,
          preferred_state: preferredState as IndianState,
          home_state: homeState as IndianState,
          open_to_abroad: openToAbroad,
        };
        await api.updateProfile(studentProfile);
        sessionStorage.removeItem("prism_pending_preferences");
        router.push("/assessment/student");
        return;
      }

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
      if (isMockMode) {
        sessionStorage.setItem("prism_mock_role", "student");
      }

      // 2. Email confirmation check (Item 1c, Comment 1)
      if (authData.user && !authData.session) {
        setEmailNotice("Check your email to confirm your account, then sign in");
        return;
      }

      // 3. If session exists immediately, save profile now
      const studentProfile: StudentProfile = {
        role: "student",
        risk_appetite: riskAppetite,
        preferred_state: preferredState as IndianState,
        home_state: homeState as IndianState,
        open_to_abroad: openToAbroad,
      };

      await api.updateProfile(studentProfile);
      sessionStorage.removeItem("prism_pending_preferences");

      router.push("/assessment/student");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      if (err instanceof ApiError) {
        setError(err.message);
        const detailsObj = err.details as { fields?: Array<{ field?: string; issue?: string }> } | undefined;
        if (detailsObj && Array.isArray(detailsObj.fields)) {
          const fieldMap: Record<string, string> = {};
          for (const f of detailsObj.fields) {
            if (f.field && f.issue) {
              const plainField = f.field.replace(/^student\./, "");
              fieldMap[plainField] = f.issue;
            }
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-violet-600/15 rounded-full blur-[110px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Student Account</Badge>
            <Link
              href="/signin"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors"
            >
              Sign In Instead
            </Link>
          </div>
          <CardTitle className="text-2xl pt-2">Create Student Profile</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Calibrate entrance exam milestones, state quota schemes, and psychometric baseline vectors.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            {emailNotice ? (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs space-y-2">
                <p className="font-semibold text-white">{emailNotice}</p>
                <p className="text-[11px] text-slate-300">
                  After verifying your email, sign in to calibrate your preferences and begin your assessment.
                </p>
                <div className="pt-1">
                  <Link href="/signin">
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}

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
                Full Name <span className="text-rose-400">*</span>
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
                Email Address <span className="text-rose-400">*</span>
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

            {/* Comment 7: Home State starts unselected */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Home State / Domicile <span className="text-rose-400">*</span></span>
                </span>
                {fieldErrors.home_state && (
                  <span className="text-[10px] text-rose-400">{fieldErrors.home_state}</span>
                )}
              </label>
              <select
                value={homeState}
                onChange={(e) => setHomeState(e.target.value as IndianState)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="" disabled className="text-slate-500">
                  Select your state
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Comment 7: Preferred State starts unselected */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Preferred State to Study and Work <span className="text-rose-400">*</span></span>
                </span>
                {fieldErrors.preferred_state && (
                  <span className="text-[10px] text-rose-400">{fieldErrors.preferred_state}</span>
                )}
              </label>
              <select
                value={preferredState}
                onChange={(e) => setPreferredState(e.target.value as IndianState)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="" disabled className="text-slate-500">
                  Select your state
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Comment 7: Risk Appetite (1-5) starts unselected */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  How comfortable are you with risk? <span className="text-rose-400">*</span>
                </span>
                {riskAppetite !== null && (
                  <span className="font-mono font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded">
                    {riskAppetite} / 5
                  </span>
                )}
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
              <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                <span>1 · Avoids Risk</span>
                <span>3 · Moderate</span>
                <span>5 · Dynamic</span>
              </div>
              {fieldErrors.risk_appetite && (
                <p className="text-[10px] text-rose-400">{fieldErrors.risk_appetite}</p>
              )}
            </div>

            {/* Comment 7: Open to Studying Abroad (yes/no) starts unselected */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Open to studying abroad? <span className="text-rose-400">*</span></span>
                </span>
                {fieldErrors.open_to_abroad && (
                  <span className="text-[10px] text-rose-400">{fieldErrors.open_to_abroad}</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOpenToAbroad(true)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    openToAbroad === true
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
                    openToAbroad === false
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  No, domestic only
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>We never sell student data. Used solely for deterministic guidance models.</span>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Link
              href="/signin"
              className="text-xs text-slate-400 hover:text-white transition-colors order-2 sm:order-1"
            >
              Already have an account? Sign In
            </Link>
            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50 order-1 sm:order-2"
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
      </Card>
    </div>
  );
}
