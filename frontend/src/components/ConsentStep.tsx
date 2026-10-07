"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface ConsentStepProps {
  role: "student" | "parent";
  onConsentGranted: () => void;
  consented?: boolean;
  partnerConsented?: boolean;
  onConsentWithdrawn?: () => void;
  onSkip?: () => void;
}

export function ConsentStep({
  role,
  onConsentGranted,
  consented = false,
  partnerConsented,
  onConsentWithdrawn,
  onSkip,
}: ConsentStepProps) {
  const [agreed, setAgreed] = React.useState(consented);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [currentConsented, setCurrentConsented] = React.useState(consented);

  // Sync state when props change (Comment 3)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAgreed(Boolean(consented));
      setCurrentConsented(Boolean(consented));
    }, 0);
    return () => clearTimeout(timer);
  }, [consented]);

  const isStudent = role === "student";
  const partnerLabel = isStudent ? "parent" : "child";

  const explanation = isStudent
    ? "Your parent will see derived career alignment scores, the Parent-Student Conflict Index, and joint career roadmaps. Your individual survey answers are kept strictly private and will never be shared."
    : "Your child will see financial feasibility status, the Parent-Student Conflict Index, and joint career roadmaps. Your exact family savings, budget, and income figures are kept strictly private and will never be shared.";

  const checkboxLabel = isStudent
    ? "I agree to share my results with my parent"
    : "I agree to share my results with my child";

  const handleGrantConsent = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError("");

    try {
      await api.postConsent(true);
      setCurrentConsented(true);
      onConsentGranted();
    } catch (err) {
      console.error("Failed to grant consent:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to record consent. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setSubmitting(true);
    setError("");

    try {
      await api.postConsent(false);
      setCurrentConsented(false);
      setAgreed(false);
      if (onConsentWithdrawn) {
        onConsentWithdrawn();
      }
    } catch (err) {
      console.error("Failed to withdraw consent:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to withdraw consent. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant="cyan">Privacy &amp; Data Sharing Consent</Badge>
          <span className="text-xs text-slate-400 capitalize">{role} Consent</span>
        </div>
        <CardTitle className="text-xl pt-2">Cross-Generational Comparison Consent</CardTitle>
        <CardDescription className="text-xs text-slate-400 leading-relaxed">
          PRISM Engine uses dual consent to ensure transparency while safeguarding your private inputs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Explanation text (2 clear sentences) */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>What gets shared</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{explanation}</p>
        </div>

        {/* Partner status notice */}
        {partnerConsented !== undefined && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Partner consent status:</span>
            {partnerConsented ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Agreed
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                Waiting for your {partnerLabel} to agree
              </span>
            )}
          </div>
        )}

        {/* Consent Checkbox */}
        {!currentConsented ? (
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-violet-500/30 bg-violet-950/15 cursor-pointer hover:bg-violet-950/25 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <span className="text-xs text-slate-200 font-medium leading-relaxed">
                {checkboxLabel}
              </span>
            </label>
            <p className="text-[11px] text-slate-400 leading-relaxed px-1">
              You can agree later from the dashboard. Until both you and your {partnerLabel} agree, neither side sees the cross-generational comparison.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>You have granted sharing consent.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWithdrawConsent}
              disabled={submitting}
              className="text-[11px] h-7 border-rose-500/30 text-rose-300 hover:bg-rose-950/30"
            >
              Withdraw consent
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="h-3 w-3 shrink-0 text-slate-500" />
          <span>Your raw answers stay on our server. Only the comparison is shared.</span>
        </div>
        {!currentConsented ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={submitting}
                className="text-xs text-slate-400 hover:text-white hover:bg-white/5"
              >
                Not now
              </Button>
            )}
            <Button
              type="button"
              disabled={!agreed || submitting}
              onClick={handleGrantConsent}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs shadow-lg shadow-violet-950/50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Agree & Continue"
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={onConsentGranted}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
          >
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
