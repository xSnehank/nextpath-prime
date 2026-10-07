"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";

interface ConsentStepProps {
  role: "student" | "parent";
  onConsentGranted: () => void;
  consented?: boolean;
  partnerConsented?: boolean;
  onConsentWithdrawn?: () => void;
  onSkip?: () => void;
}

/** Agree (or not yet) to the parent-student comparison. Nothing is shared until both agree. */
export function ConsentStep({ role, onConsentGranted, consented = false, partnerConsented, onConsentWithdrawn, onSkip }: ConsentStepProps) {
  const [agreed, setAgreed] = React.useState(consented);
  const [isConsented, setIsConsented] = React.useState(consented);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Follow the prop when /me loads after this mounts.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAgreed(Boolean(consented));
      setIsConsented(Boolean(consented));
    }, 0);
    return () => clearTimeout(timer);
  }, [consented]);

  const partner = role === "student" ? "parent" : "child";
  const privateText =
    role === "student"
      ? "Your parent sees the scores and the comparison, never your answers."
      : "Your child sees what's affordable and the comparison, never your budget, savings or income.";

  const send = async (agree: boolean) => {
    setSubmitting(true);
    setError("");
    try {
      await api.postConsent(agree);
      setIsConsented(agree);
      setAgreed(agree);
      if (agree) onConsentGranted();
      else onConsentWithdrawn?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Share the comparison with your {partner}?</h2>
        <p className="mt-1 text-sm text-muted-foreground">{privateText}</p>
      </div>
      {error && <Notice>{error}</Notice>}
      {partnerConsented !== undefined && (
        <p className="text-sm text-muted-foreground">
          Your {partner}: {partnerConsented ? <span className="text-success">agreed</span> : "hasn't agreed yet"}
        </p>
      )}

      {isConsented ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> You&apos;ve agreed
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={submitting} onClick={() => send(false)}>
              Withdraw
            </Button>
            <Button size="sm" onClick={onConsentGranted}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            I agree to share the comparison with my {partner}
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            {onSkip && (
              <Button variant="ghost" size="sm" disabled={submitting} onClick={onSkip}>
                Not now
              </Button>
            )}
            <Button size="sm" disabled={!agreed || submitting} onClick={() => send(true)}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Agree
            </Button>
          </div>
          {onSkip && <p className="text-xs text-muted-foreground">You can agree later from the dashboard. Nothing is shared until you both agree.</p>}
        </>
      )}
    </div>
  );
}
