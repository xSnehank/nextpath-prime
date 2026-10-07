"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, UserCheck, ShieldCheck, School, MapPin, Loader2 } from "lucide-react";
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

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [grade, setGrade] = React.useState(GRADES[2]); // Default Grade 11 PCM
  const [state, setState] = React.useState<IndianState>("Maharashtra");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("prism_student_name", name);
      localStorage.setItem("prism_student_email", email);
      localStorage.setItem("prism_student_grade", grade);
      localStorage.setItem("prism_student_state", state);

      // Save student profile via PUT /profile (Comment 2/14)
      const studentProfile: StudentProfile = {
        role: "student",
        risk_appetite: 3,
        preferred_state: state,
        home_state: state,
        open_to_abroad: false,
      };

      await api.updateProfile(studentProfile).catch((err) => {
        console.warn("Profile pre-save optional in mock mode:", err);
      });

      // Generate parent invite code via POST /auth/invite
      const invite = await api.createInvite().catch(() => null);
      if (invite?.invite_code) {
        localStorage.setItem("prism_parent_invite_code", invite.invite_code);
      }

      // Land on student assessment page
      router.push("/assessment/student");
    } catch (err) {
      console.error("Signup error:", err);
      if (err instanceof ApiError) {
        setError(`API Error: ${err.message}`);
      } else {
        setError("Failed to create student session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = () => {
    setName("Aarav Sharma");
    setEmail("aarav.sharma@example.in");
    setGrade(GRADES[2]);
    setState("Maharashtra");
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Student Onboarding</Badge>
            <span className="text-xs text-slate-400">Step 1 of 3</span>
          </div>
          <CardTitle className="text-2xl pt-2">Create Student Profile</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Calibrate entrance exam milestones, state quota schemes, and psychometric baseline vectors.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Quick Demo Pre-fill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <span className="text-slate-400">Quick fill sample candidate?</span>
              <button
                type="button"
                onClick={handleGoogleMock}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
              >
                Auto-fill Sample
              </button>
            </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>Home State / Domicile</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as IndianState)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>We never sell student data. Used solely for deterministic guidance models.</span>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-between items-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initialising Profile...
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
