"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, AlertCircle, Loader2, Globe } from "lucide-react";
import { api, ApiError } from "@/lib/api";
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

export default function OnboardingPage() {
  const router = useRouter();

  // Inputs start unselected (Comment 7)
  const [homeState, setHomeState] = React.useState<IndianState | "">("");
  const [preferredState, setPreferredState] = React.useState<IndianState | "">("");
  const [riskAppetite, setRiskAppetite] = React.useState<number | null>(null);
  const [openToAbroad, setOpenToAbroad] = React.useState<boolean | null>(null);

  // Optional fields
  const [category, setCategory] = React.useState<"general" | "obc" | "sc" | "st" | "ews" | "">("");
  const [percentage, setPercentage] = React.useState<string>("");
  const [gender, setGender] = React.useState<"female" | "male" | "other" | "">("");

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Check if profile is already complete or load pending preferences from sessionStorage
  React.useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const me = await api.getMe();
        if (!active) return;
        if (me.role !== "student") {
          router.replace("/dashboard");
          return;
        }
        if (me.progress?.profile_complete) {
          router.replace(
            !me.progress?.assessment_complete ? "/assessment/student" : "/dashboard"
          );
          return;
        }
      } catch {
        // me fetch failed
      }

      // Pre-fill from sessionStorage if present (Comment 1)
      try {
        const pendingRaw = sessionStorage.getItem("prism_pending_preferences");
        if (pendingRaw) {
          const parsed = JSON.parse(pendingRaw);
          if (parsed.home_state) setHomeState(parsed.home_state);
          if (parsed.preferred_state) setPreferredState(parsed.preferred_state);
          if (typeof parsed.risk_appetite === "number") setRiskAppetite(parsed.risk_appetite);
          if (typeof parsed.open_to_abroad === "boolean") setOpenToAbroad(parsed.open_to_abroad);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.percentage) setPercentage(String(parsed.percentage));
          if (parsed.gender) setGender(parsed.gender);
        }
      } catch {
        // sessionStorage unparseable
      }
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, [router]);

  const canSubmit = Boolean(
    homeState &&
    preferredState &&
    riskAppetite !== null &&
    openToAbroad !== null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please complete all required preference selections.");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const studentProfile: StudentProfile = {
        role: "student",
        risk_appetite: riskAppetite as number,
        preferred_state: preferredState as IndianState,
        home_state: homeState as IndianState,
        open_to_abroad: Boolean(openToAbroad),
      };

      if (category) {
        studentProfile.category = category as "general" | "obc" | "sc" | "st" | "ews";
      }
      if (percentage.trim()) {
        const num = parseFloat(percentage);
        if (!isNaN(num)) {
          studentProfile.percentage = num;
        }
      }
      if (gender) {
        studentProfile.gender = gender as "female" | "male" | "other";
      }

      // Save student profile via PUT /profile (Comment 1)
      await api.updateProfile(studentProfile);

      // Clean up pending preferences
      sessionStorage.removeItem("prism_pending_preferences");

      // Verify progress and route
      const me = await api.getMe();
      if (!me.progress?.assessment_complete) {
        router.push("/assessment/student");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      console.error("Failed to save student preferences:", err);
      if (err instanceof ApiError) {
        setError(err.message);
        const detailsObj = err.details as { fields?: Array<{ field?: string; issue?: string }> } | undefined;
        if (detailsObj && Array.isArray(detailsObj.fields)) {
          const map: Record<string, string> = {};
          for (const f of detailsObj.fields) {
            if (f.field && f.issue) {
              const plainField = f.field.replace(/^student\./, "");
              map[plainField] = f.issue;
            }
          }
          setFieldErrors(map);
        }
      } else {
        setError("Failed to save preferences. Please check your inputs and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-violet-600/15 rounded-full blur-[110px] pointer-events-none" />

      <Card className="w-full max-w-xl border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Step 1 of 2 · Onboarding</Badge>
            <span className="text-xs text-slate-400">Student Profile</span>
          </div>
          <CardTitle className="text-2xl pt-2">Calibrate Your Preferences</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Tell us about your geographic and risk comfort levels so the PRISM Engine can match real state scholarships and career paths.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Home State (required, starts unselected) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Home State (Domicile) <span className="text-rose-400">*</span></span>
                {fieldErrors.home_state && (
                  <span className="text-[11px] text-rose-400">{fieldErrors.home_state}</span>
                )}
              </label>
              <select
                value={homeState}
                onChange={(e) => setHomeState(e.target.value as IndianState)}
                required
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">
                  Select your state
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state} className="bg-slate-900 text-white">
                    {state}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">Used for state-specific domicile scholarships and regional quotas.</p>
            </div>

            {/* Preferred State (required, starts unselected) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Preferred State to Study &amp; Work <span className="text-rose-400">*</span></span>
                {fieldErrors.preferred_state && (
                  <span className="text-[11px] text-rose-400">{fieldErrors.preferred_state}</span>
                )}
              </label>
              <select
                value={preferredState}
                onChange={(e) => setPreferredState(e.target.value as IndianState)}
                required
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">
                  Select your state
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state} className="bg-slate-900 text-white">
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Appetite (required, 1-5 buttons, starts unselected) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  How comfortable are you with risk? <span className="text-rose-400">*</span>
                </label>
                {fieldErrors.risk_appetite && (
                  <span className="text-[11px] text-rose-400">{fieldErrors.risk_appetite}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = riskAppetite === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRiskAppetite(val)}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/30"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                <span>1 · Avoids Risk (Stable)</span>
                <span>3 · Moderate</span>
                <span>5 · High Risk (Dynamic)</span>
              </div>
            </div>

            {/* Open to Abroad (required, two unselected Yes/No buttons) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Open to studying abroad? <span className="text-rose-400">*</span>
                </label>
                {fieldErrors.open_to_abroad && (
                  <span className="text-[11px] text-rose-400">{fieldErrors.open_to_abroad}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOpenToAbroad(true)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    openToAbroad === true
                      ? "bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Yes, open to abroad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenToAbroad(false)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    openToAbroad === false
                      ? "bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>No, domestic only</span>
                </button>
              </div>
            </div>

            {/* Optional Fields Accordion / Section */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Scholarship Criteria (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "general" | "obc" | "sc" | "st" | "ews" | "")}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">Not specified</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                    <option value="ews">EWS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Board %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 88.5"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "female" | "male" | "other" | "")}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">Not specified</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Preferences...
                </>
              ) : (
                "Save & Continue to Assessment"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
