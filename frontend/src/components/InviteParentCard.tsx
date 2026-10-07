"use client";

import * as React from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";

interface InviteParentCardProps {
  initialCode?: string;
  onInviteCreated?: (code: string) => void;
}

/** The student's invite code for their parent, with a copy-link button. Creates a code if there isn't one. */
export function InviteParentCard({ initialCode = "", onInviteCreated }: InviteParentCardProps) {
  const [code, setCode] = React.useState(initialCode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const createInvite = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const invite = await api.createInvite();
      setCode(invite.invite_code);
      onInviteCreated?.(invite.invite_code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create an invite code.");
    } finally {
      setLoading(false);
    }
  }, [onInviteCreated]);

  // The timer stops React's development double-mount from creating two codes.
  React.useEffect(() => {
    if (code) return;
    const timer = setTimeout(createInvite, 0);
    return () => clearTimeout(timer);
  }, [code, createInvite]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/parent/join?code=${encodeURIComponent(code)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Invite your parent</h2>
        <p className="mt-1 text-sm text-muted-foreground">Send them this link, or the code. It works once and lasts 7 days.</p>
      </div>
      {error && (
        <Notice>
          {error}{" "}
          <button type="button" onClick={createInvite} className="font-semibold underline underline-offset-2">
            Try again
          </button>
        </Notice>
      )}
      {loading && !code ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        code && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="select-all font-mono text-lg font-semibold tracking-wider">{code}</span>
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        )
      )}
    </div>
  );
}
