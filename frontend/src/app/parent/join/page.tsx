"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, ArrowRight, Link2, ShieldCheck } from "lucide-react";

function ParentJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [parentName, setParentName] = React.useState("");
  const [parentEmail, setParentEmail] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [isLinked, setIsLinked] = React.useState(false);
  const [studentDetails, setStudentDetails] = React.useState<{
    name: string;
    grade: string;
    state: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Check URL or localStorage for student invite code
    const queryCode = searchParams.get("code");
    const storedCode = localStorage.getItem("prism_parent_invite_code") || "PRISM-DEMO";
    const codeToUse = queryCode || storedCode;
    setInviteCode(codeToUse);

    // Check if student exists in localStorage
    const sName = localStorage.getItem("prism_student_name") || "Aarav Sharma";
    const sGrade = localStorage.getItem("prism_student_grade") || "Grade 11 - Science (PCM)";
    const sState = localStorage.getItem("prism_student_state") || "Maharashtra";

    setStudentDetails({
      name: sName,
      grade: sGrade,
      state: sState,
    });
  }, [searchParams]);

  const handleVerifyLink = () => {
    if (!inviteCode.trim()) {
      setError("Please provide a valid invite code from your child.");
      return;
    }
    setError("");
    setIsLinked(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      const parentId = `parent_${Date.now()}`;
      localStorage.setItem("prism_parent_id", parentId);
      localStorage.setItem("prism_parent_name", parentName);
      localStorage.setItem("prism_parent_email", parentEmail);
      localStorage.setItem("prism_profiles_linked", "true");

      // Navigate to Parent Assessment form (Epic B2/B3)
      router.push("/assessment/parent");
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
            <Badge variant="cyan">Epic A2 • Parent Onboarding</Badge>
            <span className="text-xs text-slate-400">Profile Pairing</span>
          </div>
          <CardTitle className="text-2xl pt-2">Join via Student Invite</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Link your parent account to review financial feasibility, enter budget parameters, and resolve conflict points together.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Invite Code Verification Box */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Student Invite Code</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setIsLinked(false);
                  }}
                  placeholder="e.g. PRISM-78X2A"
                  className="font-mono tracking-widest text-cyan-300"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleVerifyLink}
                  className="shrink-0"
                >
                  Verify
                </Button>
              </div>

              {/* Linked Confirmation Status */}
              {(isLinked || inviteCode) && studentDetails && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs flex items-start gap-2 animate-fade-in-up">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-emerald-300 font-semibold">
                      Successfully Paired with Student
                    </p>
                    <p className="text-slate-300">
                      Child: <strong className="text-white">{studentDetails.name}</strong> • {studentDetails.grade} ({studentDetails.state})
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Parent Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Parent / Guardian Full Name
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
                Email Address
              </label>
              <Input
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Confidentiality Notice: Both profiles remain locked until each stakeholder submits their inputs.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 font-semibold shadow-lg shadow-cyan-600/25"
            >
              <span>{loading ? "Pairing Profiles..." : "Continue to Financial Form"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ParentJoinPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-xs">
          Loading Parent Invitation...
        </div>
      }
    >
      <ParentJoinContent />
    </React.Suspense>
  );
}
