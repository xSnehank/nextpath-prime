"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConsentStep } from "@/components/ConsentStep";
import { InviteParentCard } from "@/components/InviteParentCard";
import { Notice, PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/api";

const storageKeys = (userId: string) => ({
  answers: userId ? `prism_student_answers:${userId}` : "prism_student_answers",
  index: userId ? `prism_student_current_index:${userId}` : "prism_student_current_index",
});

export default function StudentAssessmentPage() {
  const router = useRouter();
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [showMap, setShowMap] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [consented, setConsented] = React.useState(false);
  const [partnerConsented, setPartnerConsented] = React.useState<boolean | undefined>(undefined);
  const [hasParent, setHasParent] = React.useState(false);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimer = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  };
  React.useEffect(() => stopTimer, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, me] = await Promise.all([api.getQuestions("student"), api.getMe().catch(() => null)]);
        if (!active) return;
        if (me?.role === "student") {
          if (!me.progress.profile_complete) return router.replace("/onboarding");
          if (me.progress.assessment_complete) return router.replace("/dashboard");
          setConsented(Boolean(me.consented));
          setPartnerConsented(me.partner?.consented);
          setHasParent(Boolean(me.pair));
        }
        setQuestions(list);
        const id = me?.user_id ?? "";
        setUserId(id);
        // Resume saved progress, keeping only answers to questions that still exist.
        try {
          const keys = storageKeys(id);
          const saved = JSON.parse(localStorage.getItem(keys.answers) || "{}") as Record<string, unknown>;
          const valid = new Set(list.map((q) => q.id));
          const restored: Record<string, number> = {};
          for (const [qid, value] of Object.entries(saved)) {
            const n = Number(value);
            if (valid.has(qid) && Number.isInteger(n) && n >= 1 && n <= 5) restored[qid] = n;
          }
          setAnswers(restored);
          const savedIndex = parseInt(localStorage.getItem(keys.index) || "", 10);
          if (savedIndex >= 0 && savedIndex < list.length) setIndex(savedIndex);
        } catch {
          // nothing saved
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Couldn't load the questions.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const total = questions.length;
  const question = questions[index];
  const answered = Object.keys(answers).length;

  const save = (next: Record<string, number>, nextIndex: number) => {
    try {
      const keys = storageKeys(userId);
      localStorage.setItem(keys.answers, JSON.stringify(next));
      localStorage.setItem(keys.index, String(nextIndex));
    } catch {
      // storage unavailable: progress just isn't remembered
    }
  };

  const goTo = (target: number) => {
    stopTimer();
    const clamped = Math.min(Math.max(target, 0), total - 1);
    setIndex(clamped);
    save(answers, clamped);
  };

  const choose = (value: number) => {
    stopTimer();
    if (!question) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    save(next, index);
    if (index < total - 1) advanceTimer.current = setTimeout(() => setIndex((i) => Math.min(i + 1, total - 1)), 300);
  };

  const finish = async () => {
    stopTimer();
    setSubmitting(true);
    setError("");
    try {
      await api.postResponses(Object.entries(answers).map(([question_id, value]) => ({ question_id, value })));
      const keys = storageKeys(userId);
      localStorage.removeItem(keys.answers);
      localStorage.removeItem(keys.index);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-muted-foreground" />;
  }

  if (done) {
    return (
      <PageShell title="Assessment complete" subtitle="Two quick steps, then your plan appears once your parent is done too." width="md">
        <div className="space-y-4">
          {!hasParent && <InviteParentCard />}
          <ConsentStep
            role="student"
            consented={consented}
            partnerConsented={partnerConsented}
            onConsentGranted={() => router.push("/dashboard")}
            onSkip={() => router.push("/dashboard")}
          />
        </div>
      </PageShell>
    );
  }

  if (!question) {
    return (
      <PageShell title="Assessment">
        <Notice>{error || "No questions found."}</Notice>
      </PageShell>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {total}
        </span>
        <button type="button" onClick={() => setShowMap(!showMap)} className="inline-flex items-center gap-1 hover:text-foreground">
          <LayoutGrid className="h-3.5 w-3.5" /> {answered}/{total} answered
        </button>
      </div>
      <Progress value={((index + 1) / total) * 100} />

      {showMap && (
        <div className="mt-3 grid grid-cols-8 gap-1.5 rounded-2xl border border-border bg-card p-3 sm:grid-cols-11">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                goTo(i);
                setShowMap(false);
              }}
              className={cn(
                "h-8 rounded-lg text-xs font-medium",
                i === index ? "bg-primary text-primary-foreground" : answers[q.id] !== undefined ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs text-muted-foreground">{question.kind === "choice" ? "Pick the one correct answer" : "How much do you agree?"}</p>
        <h1 className="mt-2 text-lg font-medium leading-relaxed sm:text-xl">{question.text}</h1>
        {error && <Notice className="mt-4">{error}</Notice>}
        <div className="mt-5 space-y-2">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => choose(option.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  selected ? "border-accent bg-primary/15 font-medium" : "border-border hover:bg-muted"
                )}
              >
                {option.label}
                {selected && <CheckCircle2 className="h-4 w-4 text-accent" />}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {index === total - 1 ? (
            <Button size="sm" onClick={finish} disabled={submitting || answered < total}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {answered < total ? `${total - answered} left` : "Finish"}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => goTo(index + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
