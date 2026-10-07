"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, UserCheck, ShieldCheck, School, MapPin } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi NCR", "Other UT"
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
  const [state, setState] = React.useState(INDIAN_STATES[13]); // Default Maharashtra
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
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
      const studentId = `student_${Date.now()}`;
      localStorage.setItem("prism_student_id", studentId);
      localStorage.setItem("prism_student_name", name);
      localStorage.setItem("prism_student_email", email);
      localStorage.setItem("prism_student_grade", grade);
      localStorage.setItem("prism_student_state", state);

      // Generate a mock invite link for their parent (Epic A2)
      const inviteCode = `PRISM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      localStorage.setItem("prism_parent_invite_code", inviteCode);

      // Land directly on student assessment page
      router.push("/assessment/student");
    } catch {
      setError("Failed to save student profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = () => {
    setName("Aarav Sharma");
    setEmail("aarav.sharma@example.in");
    setGrade(GRADES[2]);
    setState(INDIAN_STATES[13]);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Epic A1 • Student Onboarding</Badge>
            <span className="text-xs text-slate-400">Step 1 of 3</span>
          </div>
          <CardTitle className="text-2xl pt-2">Create Student Profile</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Tell us your educational stage and region to calibrate entrance exams, state quotas, and psychometric baseline.
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
              <span className="text-slate-400">Quick fill demo credentials?</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-violet-400" />
                  <span>Current Grade</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-inner backdrop-blur-md focus:border-violet-500 focus:outline-none"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g} className="bg-slate-950 text-slate-100">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  <span>State / UT (Home Domicile)</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-inner backdrop-blur-md focus:border-cyan-500 focus:outline-none"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} className="bg-slate-950 text-slate-100">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Your responses remain private until both you and your parent complete your respective assessments.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 font-semibold shadow-lg shadow-violet-600/25"
            >
              <span>{loading ? "Saving Profile..." : "Proceed to Assessment"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
