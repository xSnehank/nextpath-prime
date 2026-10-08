"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConflictGauge } from "@/components/ConflictGauge";
import { RadarTraitsChart } from "@/components/RadarTraitsChart";
import { FinanceBreakdownCard } from "@/components/FinanceBreakdownCard";
import { MarketDemandCard } from "@/components/MarketDemandCard";
import { WhatIfSliders, type WeightVector } from "@/components/WhatIfSliders";
import { SwotMatrix } from "@/components/SwotMatrix";
import { PdfExportButton } from "@/components/PdfExportButton";
import { InviteParentCard } from "@/components/InviteParentCard";
import { ConsentStep } from "@/components/ConsentStep";
import { Notice, PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalyzeResponse, CareerPath, MeResponse } from "@/types/api";

const DEFAULT_WEIGHTS: WeightVector = { fit: 0.45, finance: 0.3, market: 0.25, alpha: 0.45, beta: 0.3, gamma: 0.25 };

const TABS = [
  { id: "careers", label: "Careers" },
  { id: "comparison", label: "Comparison" },
  { id: "cost", label: "Cost" },
  { id: "jobs", label: "Jobs" },
  { id: "strengths", label: "Strengths" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Explanation = { text?: string; source?: string; error?: boolean };

/** The plan appears only when both have finished and both agreed; otherwise, what's still missing. */
function isReady(me: MeResponse) {
  return Boolean(me.pair && me.progress.assessment_complete && me.consented && me.partner?.assessment_complete && me.partner?.consented);
}

export default function DashboardPage() {
  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [data, setData] = React.useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [weights, setWeights] = React.useState<WeightVector>(DEFAULT_WEIGHTS);
  const [showSliders, setShowSliders] = React.useState(false);
  const [tab, setTab] = React.useState<TabId>("careers");
  const [selectedId, setSelectedId] = React.useState("");
  const [explanations, setExplanations] = React.useState<Record<string, Explanation>>({});
  const [loadingExplanation, setLoadingExplanation] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const who = await api.getMe();
        if (!active) return;
        setMe(who);
        if (!isReady(who)) return;
        const result = who.latest_result_id
          ? await api.getResults(who.latest_result_id)
          : await api.analyze({ student_id: who.pair!.student_id, parent_id: who.pair!.parent_id, weights: DEFAULT_WEIGHTS });
        if (!active) return;
        setData(result);
        setWeights({ ...result.weights, alpha: result.weights.fit, beta: result.weights.finance, gamma: result.weights.market });
        if (result.roadmap.length) setSelectedId(result.roadmap[0].id);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // What-if: re-rank with the slider weights (viable paths first, then by score).
  const ranked: CareerPath[] = React.useMemo(() => {
    if (!data) return [];
    return data.roadmap
      .map((c) => ({
        ...c,
        finalScore: Number(((weights.fit * c.rawScores.fit + weights.finance * c.rawScores.finance + weights.market * c.rawScores.market) * 100).toFixed(1)),
      }))
      .sort((a, b) => (a.financeViable !== b.financeViable ? (a.financeViable ? -1 : 1) : b.finalScore - a.finalScore));
  }, [data, weights]);
  const active = ranked.find((c) => c.id === selectedId) ?? ranked[0];

  const fetchExplanation = React.useCallback(
    async (careerId: string) => {
      if (!data) return;
      setLoadingExplanation(true);
      try {
        const res = await api.explain({ result_id: data.resultId, career_id: careerId });
        setExplanations((prev) => ({ ...prev, [careerId]: { text: res.text, source: res.source } }));
      } catch {
        setExplanations((prev) => ({ ...prev, [careerId]: { error: true } }));
      } finally {
        setLoadingExplanation(false);
      }
    },
    [data]
  );
  React.useEffect(() => {
    if (!data || !active || explanations[active.id]) return;
    const id = active.id;
    const timer = setTimeout(() => fetchExplanation(id), 0);
    return () => clearTimeout(timer);
  }, [active, data, explanations, fetchExplanation]);

  if (loading) {
    return (
      <div className="mt-24 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" /> Building your plan…
      </div>
    );
  }

  if (error || !me) {
    return (
      <PageShell title="Something went wrong">
        <Notice>{error || "Please sign in again."}</Notice>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      </PageShell>
    );
  }

  if (!data) return <WaitingFor me={me} />;

  const isStudent = me.role === "student";
  const studentName = (isStudent ? me.full_name : me.partner?.full_name) || "Student";
  const parentName = (isStudent ? me.partner?.full_name : me.full_name) || "Parent";
  const title = isStudent ? "Your career plan" : `${me.partner?.full_name || "Your child"}'s career plan`;
  const bestDomain = data.domainScores[0]?.domain;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {bestDomain && <p className="mt-1 text-sm text-muted-foreground">Best fit: {bestDomain}</p>}
        </div>
        <PdfExportButton data={{ ...data, roadmap: ranked }} studentName={studentName} parentName={parentName} />
      </div>

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t.id ? "border-accent font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "careers" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowSliders(!showSliders)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              aria-expanded={showSliders}
            >
              <SlidersHorizontal className="h-4 w-4" /> Adjust priorities
              <ChevronDown className={cn("h-4 w-4 transition-transform", showSliders && "rotate-180")} />
            </button>
            {showSliders && <WhatIfSliders weights={weights} onChange={setWeights} onReset={() => setWeights(DEFAULT_WEIGHTS)} />}

            <div className="grid gap-4 lg:grid-cols-5">
              <ol className="space-y-2 lg:col-span-2">
                {ranked.map((career, i) => (
                  <li key={career.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(career.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        career.id === active?.id ? "border-accent bg-primary/10" : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                            {career.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{career.domain}</p>
                        </div>
                        <span className="font-display text-lg font-semibold">{Math.round(career.finalScore)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant={career.financeViable ? "success" : "danger"}>{career.financeViable ? "Affordable" : "Over budget"}</Badge>
                        <Badge variant="outline">Demand {career.marketDemand}%</Badge>
                        {career.streamMatch === "open" && <Badge variant="warning">Outside your stream</Badge>}
                      </div>
                    </button>
                  </li>
                ))}
              </ol>

              {active && (
                <div className="space-y-5 rounded-2xl border border-border bg-card p-5 lg:col-span-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{active.title}</h2>
                      <p className="text-sm text-muted-foreground">{active.domain}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-semibold">{Math.round(active.finalScore)}</p>
                      <p className="text-xs text-muted-foreground">out of 100</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted p-4 text-sm leading-relaxed">
                    {loadingExplanation && !explanations[active.id] ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Writing the explanation…
                      </span>
                    ) : explanations[active.id]?.error ? (
                      <span className="text-muted-foreground">
                        Explanation unavailable.{" "}
                        <button type="button" onClick={() => fetchExplanation(active.id)} className="font-medium text-accent underline underline-offset-2">
                          Retry
                        </button>
                      </span>
                    ) : (
                      <>
                        <p>{explanations[active.id]?.text}</p>
                        {explanations[active.id]?.source && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {explanations[active.id]?.source === "template" ? "Standard summary" : "AI-written summary"}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {active.timeline && <Detail title="Path">{active.timeline}</Detail>}
                  <Detail title="Entrance exams">
                    {active.exams.length ? active.exams.map((e) => e.name).join(" · ") : "Admission on board marks."}
                  </Detail>
                  <Detail title="Colleges">
                    {active.typicalCollege && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        Cost based on a typical college: <span className="font-medium text-foreground">{active.typicalCollege}</span>
                      </p>
                    )}
                    <ul className="space-y-2">
                      {active.colleges.map((c) => (
                        <li key={c.name} className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5">
                              {c.tier ? (
                                <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">T{c.tier}</span>
                              ) : null}
                              <span className="truncate">{c.name}</span>
                            </p>
                            {(c.course || c.location) && (
                              <p className="truncate text-xs text-muted-foreground">{[c.course, c.location].filter(Boolean).join(" · ")}</p>
                            )}
                          </div>
                          {c.annualFee != null ? (
                            <span className="shrink-0 text-muted-foreground">
                              {c.annualFee === 0 ? "No fee" : `₹${(c.annualFee / 100000).toFixed(1)}L / yr`}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      T1–T3: NIRF 2025 tiers. Yearly fees; many are estimates, so check the college&apos;s own fee notice.
                    </p>
                  </Detail>
                  {active.scholarships.length > 0 && (
                    <Detail title="Scholarships you may qualify for">
                      <ul className="space-y-2">
                        {active.scholarships.map((s) => (
                          <li key={s.name}>
                            <div className="flex justify-between gap-3">
                              <span className="font-medium">{s.name}</span>
                              <span className="shrink-0 text-success">{s.amount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{s.matchedRule}</p>
                          </li>
                        ))}
                      </ul>
                    </Detail>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "comparison" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ConflictGauge conflict={data.conflict} />
            <RadarTraitsChart traits={data.traits} scores={data.domainScores} />
          </div>
        )}
        {tab === "cost" && <FinanceBreakdownCard financePaths={data.finance} />}
        {tab === "jobs" && <MarketDemandCard marketDataList={data.market} />}
        {tab === "strengths" && <SwotMatrix swot={data.swot} />}
      </div>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

/** Before the plan exists: the five steps, what's done, and the actions still open. */
function WaitingFor({ me }: { me: MeResponse }) {
  const isStudent = me.role === "student";
  const partner = isStudent ? "parent" : "child";
  const steps = [
    {
      label: "Your part",
      done: me.progress.assessment_complete,
      action: !me.progress.assessment_complete && (
        <Link href={isStudent ? (me.progress.profile_complete ? "/assessment/student" : "/onboarding") : "/assessment/parent"} className={buttonVariants({ size: "sm" })}>
          Continue
        </Link>
      ),
    },
    {
      label: `Linked with your ${partner}`,
      done: Boolean(me.pair),
      action: !me.pair && !isStudent && (
        <Link href="/parent/join" className={buttonVariants({ size: "sm", variant: "outline" })}>
          Enter code
        </Link>
      ),
    },
    { label: `Your ${partner}'s part`, done: Boolean(me.partner?.assessment_complete) },
    { label: "You agreed to compare", done: me.consented },
    { label: `Your ${partner} agreed to compare`, done: Boolean(me.partner?.consented) },
  ];

  return (
    <PageShell title="Almost there" subtitle="Your plan appears when you've both finished and both agreed." width="md">
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span className="flex items-center gap-3 text-sm">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">{i + 1}</span>
              )}
              <span className={cn(step.done && "text-muted-foreground")}>{step.label}</span>
            </span>
            {step.action}
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-4">
        {isStudent && !me.pair && <InviteParentCard />}
        {!me.consented && (
          <ConsentStep
            role={me.role}
            consented={me.consented}
            partnerConsented={me.partner?.consented}
            onConsentGranted={() => window.location.reload()}
            onConsentWithdrawn={() => window.location.reload()}
          />
        )}
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" /> Check again
        </Button>
      </div>
    </PageShell>
  );
}
