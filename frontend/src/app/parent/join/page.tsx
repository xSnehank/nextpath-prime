"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, ArrowRight, Link2, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";

function ParentJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read code from ?code= ONLY with NO default (Comment 6/14)
  const initialCode = searchParams.get("code") || "";
  const [inviteCode, setInviteCode] = React.useState(initialCode);
  const [isLinked, setIsLinked] = React.useState(false);
  const [linkedInfo, setLinkedInfo] = React.useState<{
    studentId: string;
    parentId: string;
    linkedAt: string;
    studentName?: string;
  } | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState("");

  // Dev user for demo/mock mode
  const parentDevUser = "22222222-2222-4222-8222-222222222222";

  const handleLinkAccounts = async (codeToLink: string) => {
    const cleanCode = codeToLink.trim();
    if (!cleanCode) {
      setError("Please enter a valid invite code from your child.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      // Call POST /auth/link { invite_code } (Comment 6/14)
      const res = await api.linkParent(cleanCode, parentDevUser);
      localStorage.setItem("prism_dev_user", parentDevUser);
      localStorage.setItem("prism_profiles_linked", "true");

      // Fetch GET /me to get linked partner details
      let studentName = "Linked Student";
      try {
        const me = await api.getMe(parentDevUser);
        if (me.partner) {
          studentName = me.full_name || "Aarav Sharma";
        }
      } catch {
        // me endpoint fallback
      }

      setLinkedInfo({
        studentId: res.student_id,
        parentId: res.parent_id,
        linkedAt: res.linked_at,
        studentName,
      });
      setIsLinked(true);
    } catch (err) {
      console.error("Link failed:", err);
      if (err instanceof ApiError) {
        if (err.code === "NOT_FOUND") {
          setError("The invite code is invalid or has expired. Please ask your student for a new code.");
        } else if (err.code === "VALIDATION_ERROR") {
          setError("Please check the invite code format.");
        } else {
          setError(`Linking error: ${err.message}`);
        }
      } else {
        setError("Unable to connect to the backend server. Please check your network.");
      }
    } finally {
      setVerifying(false);
    }
  };

  // If code was provided via URL query params on initial load, auto-verify once
  React.useEffect(() => {
    if (initialCode) {
      handleLinkAccounts(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Parent Account Linking</Badge>
            <span className="text-xs text-slate-400">Profile Pairing</span>
          </div>
          <CardTitle className="text-2xl pt-2">Join via Student Invite</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Link your parent account to calibrate household tuition affordability, enter debt constraints, and calculate conflict indices together.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
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
                  setError("");
                }}
                placeholder="e.g. PRISM-8X2A9"
                className="font-mono tracking-widest text-cyan-300 uppercase"
                disabled={verifying}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleLinkAccounts(inviteCode)}
                disabled={verifying || !inviteCode.trim()}
                className="shrink-0 text-xs"
              >
                {verifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Verify & Link"
                )}
              </Button>
            </div>

            {/* Linked Confirmation Status from Server */}
            {isLinked && linkedInfo && (
              <div className="p-3.5 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-xs flex items-start gap-2.5 animate-fade-in-up">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-emerald-300 font-semibold">
                    Successfully Linked with Student Profile
                  </p>
                  <p className="text-slate-300">
                    Linked Pair: <strong className="text-white font-mono">{linkedInfo.studentId.slice(0, 8)}...</strong> (Parent: <span className="font-mono">{linkedInfo.parentId.slice(0, 8)}...</span>)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Linked at: {new Date(linkedInfo.linkedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Data Privacy Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Under our dual-consent protocol, student psychometric answers remain confidential.
              Only aggregate conflict deltas and affordability models are shared with parents.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            type="button"
            disabled={!isLinked || verifying}
            onClick={() => router.push("/assessment/parent")}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50"
          >
            <span>Proceed to Financial Calibration</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ParentJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <ParentJoinContent />
    </Suspense>
  );
}
