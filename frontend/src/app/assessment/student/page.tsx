"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Share2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Question } from "@/types/api";

export default function StudentAssessmentPage() {
  const router = useRouter();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [showJumpGrid, setShowJumpGrid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [inviteModalCode, setInviteModalCode] = React.useState<string | null>(null);

  // Timer ref to prevent race condition & double-skipping (Comment 7/14 fix)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearAdvanceTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      clearAdvanceTimer();
    };
  }, []);

  // Fetch real questions from GET /questions?audience=student (Comment 2/14 & 8/14)
  React.useEffect(() => {
    let active = true;

    async function loadQuestions() {
      setLoadingQuestions(true);
      setErrorMessage("");
      try {
        const data = await api.getQuestions("student");
        if (active) {
          setQuestions(data);

          // Restore answers from localStorage if available
          try {
            const savedAnswers = localStorage.getItem("prism_student_answers");
            const savedIndex = localStorage.getItem("prism_student_current_index");
            if (savedAnswers) {
              setAnswers(JSON.parse(savedAnswers));
            }
            if (savedIndex) {
              const idx = parseInt(savedIndex, 10);
              if (!isNaN(idx) && idx >= 0 && idx < data.length) {
                setCurrentIndex(idx);
                setStatusMessage("Resumed from saved progress");
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      } catch (err) {
        if (active) {
          console.error("Failed to fetch student questions:", err);
          if (err instanceof ApiError) {
            setErrorMessage(`Failed to load questions: ${err.message}`);
          } else {
            setErrorMessage("Failed to load questions from backend.");
          }
        }
      } finally {
        if (active) setLoadingQuestions(false);
      }
    }

    loadQuestions();

    return () => {
      active = false;
    };
  }, []);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const saveProgress = (newAnswers: Record<string, number>, newIdx: number) => {
    try {
      localStorage.setItem("prism_student_answers", JSON.stringify(newAnswers));
      localStorage.setItem("prism_student_current_index", newIdx.toString());
    } catch {
      // Ignore
    }
  };

  // Fixed auto-advance with timer clearing and clamping (Comment 7/14)
  const handleSelectOption = (value: number) => {
    clearAdvanceTimer();
    if (!currentQ) return;

    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);
    saveProgress(updated, currentIndex);

    if (currentIndex < totalQuestions - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      }, 300);
    }
  };

  const handleNext = () => {
    clearAdvanceTimer();
    if (currentIndex < totalQuestions - 1) {
      const next = Math.min(currentIndex + 1, totalQuestions - 1);
      setCurrentIndex(next);
      saveProgress(answers, next);
    }
  };

  const handlePrevious = () => {
    clearAdvanceTimer();
    if (currentIndex > 0) {
      const prev = Math.max(currentIndex - 1, 0);
      setCurrentIndex(prev);
      saveProgress(answers, prev);
    }
  };

  const handleFinish = async () => {
    clearAdvanceTimer();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Submit answers via POST /responses (Comment 8/14: UUIDs + 1-5 values)
      const answersPayload = Object.entries(answers).map(([qId, val]) => ({
        question_id: qId,
        value: Number(val),
      }));

      await api.postResponses(answersPayload);

      // 2. Give consent via POST /consent (Comment 2/14)
      await api.postConsent(true);

      // 3. Create parent invite code via POST /auth/invite (Comment 2/14)
      const invite = await api.createInvite().catch(() => null);
      if (invite?.invite_code) {
        setInviteModalCode(invite.invite_code);
        localStorage.setItem("prism_parent_invite_code", invite.invite_code);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      if (err instanceof ApiError) {
        setErrorMessage(
          err.code === "VALIDATION_ERROR"
            ? "Some answers were formatted incorrectly. Please review and try again."
            : err.message
        );
      } else {
        setErrorMessage("An unexpected error occurred while saving your responses.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm">Loading calibrated psychometric battery from engine...</p>
      </div>
    );
  }

  if (errorMessage && questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto px-4 text-center">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
          {errorMessage}
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry Connecting
        </Button>
      </div>
    );
  }

  if (!currentQ) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Parent Invite Success Modal */}
      {inviteModalCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <Card className="w-full max-w-md border-white/10 bg-slate-900/90 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Assessment Complete!</h3>
                <p className="text-xs text-slate-400">Invite your parent to link parameters</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your 30 psychometric indicators are securely saved. Share this invite code with your parent so they can calibrate the Financial Constraint Solver:
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Single-Use Invite Code
              </span>
              <p className="font-mono text-2xl font-extrabold text-cyan-300 tracking-wider select-all">
                {inviteModalCode}
              </p>
              <p className="text-[10px] text-slate-400">
                Direct link: <code>/parent/join?code={inviteModalCode}</code>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/parent/join?code=${inviteModalCode}`
                  );
                  alert("Copied invite link to clipboard!");
                }}
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Copy Link
              </Button>
              <Button
                variant="default"
                className="flex-1 text-xs bg-violet-600 hover:bg-violet-500"
                onClick={() => router.push("/dashboard")}
              >
                View Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-4 relative z-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium text-slate-300">
              Q{currentIndex + 1} of {totalQuestions}
            </span>
            <span className="capitalize text-slate-400 font-mono">
              • {currentQ.dimension} ({currentQ.group})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage && (
              <span className="text-emerald-400 text-[11px] font-mono hidden sm:inline">
                {statusMessage}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowJumpGrid(!showJumpGrid)}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium underline underline-offset-2 transition-colors"
            >
              {showJumpGrid ? "Close Grid" : "Jump to Question"}
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-1.5 bg-white/5" />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Progress: {progressPercent}%</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
        </div>

        {/* Jump-to Grid Popover */}
        {showJumpGrid && (
          <Card className="border-white/10 bg-slate-900/90 backdrop-blur-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-200">Question Navigator</span>
              <span className="text-[11px] text-slate-400">Click any question to jump</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 pt-3">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      clearAdvanceTimer();
                      setCurrentIndex(idx);
                      setShowJumpGrid(false);
                    }}
                    className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all ${
                      isCurrent
                        ? "bg-violet-600 text-white ring-2 ring-violet-400"
                        : isAnswered
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Main Question Card */}
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" className="capitalize">
                {currentQ.group} Battery
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Estimated: ~3 mins remaining
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl pt-2 font-medium text-white leading-relaxed">
              {currentQ.text}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 pt-2">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Options List */}
            <div className="space-y-2">
              {currentQ.options.map((option) => {
                const isSelected = currentAnswer === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm transition-all duration-200 group ${
                      isSelected
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-950/50"
                        : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    <span className="font-medium group-hover:text-white transition-colors">
                      {option.label}
                    </span>
                    <span
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-violet-400 bg-violet-500 text-white"
                          : "border-white/20 group-hover:border-white/40"
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentIndex === totalQuestions - 1 ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleFinish}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Submitting Responses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete &amp; Link Parent
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                className="text-white hover:bg-white/15"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
