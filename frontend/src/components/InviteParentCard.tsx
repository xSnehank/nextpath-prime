"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, AlertCircle, Loader2, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface InviteParentCardProps {
  initialCode?: string;
  onInviteCreated?: (code: string) => void;
}

export function InviteParentCard({ initialCode = "", onInviteCreated }: InviteParentCardProps) {
  const [code, setCode] = React.useState<string>(initialCode);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);
  const [copiedCode, setCopiedCode] = React.useState<boolean>(false);

  const fetchInvite = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const invite = await api.createInvite();
      if (invite?.invite_code) {
        setCode(invite.invite_code);
        if (onInviteCreated) {
          onInviteCreated(invite.invite_code);
        }
      } else {
        setError("Unable to generate invite code. Please try again.");
      }
    } catch (err) {
      console.error("Failed to create invite:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create parent invite code. Please retry.");
      }
    } finally {
      setLoading(false);
    }
  }, [onInviteCreated]);

  React.useEffect(() => {
    if (!code) {
      const timer = setTimeout(() => {
        fetchInvite();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [code, fetchInvite]);

  const copyLink = () => {
    if (!code) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/parent/join?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCodeOnly = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Card className="w-full max-w-lg border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl relative z-10">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant="cyan">Family Account Linking</Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Parent Invite</span>
          </div>
        </div>
        <CardTitle className="text-xl pt-2">Invite Your Parent</CardTitle>
        <CardDescription className="text-xs text-slate-400 leading-relaxed">
          Share this single-use code or invite link with your parent to link your profiles and calibrate the Financial Constraint Solver.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchInvite}
              disabled={loading}
              className="text-[11px] h-7 border-rose-500/30 text-rose-300 hover:bg-rose-950/30 shrink-0"
            >
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="p-8 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">Generating secure invite code...</span>
          </div>
        ) : code ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Single-Use Invite Code
              </span>
              <p className="font-mono text-2xl font-extrabold text-cyan-300 tracking-wider select-all">
                {code}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Direct URL: <code className="text-slate-300">/parent/join?code={code}</code>
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="pt-2 flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={copyLink}
          disabled={!code || loading}
          className="w-full sm:flex-1 text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Copy Invite Link
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={copyCodeOnly}
          disabled={!code || loading}
          className="w-full sm:w-auto text-xs border-white/10 text-slate-300 hover:bg-white/5"
        >
          {copiedCode ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Code Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
