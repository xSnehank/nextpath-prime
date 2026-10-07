"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConflictGauge } from "@/components/ConflictGauge";
import { RadarTraitsChart } from "@/components/RadarTraitsChart";
import { FinanceBreakdownCard } from "@/components/FinanceBreakdownCard";
import { MarketDemandCard } from "@/components/MarketDemandCard";
import { WhatIfSliders, type WeightVector } from "@/components/WhatIfSliders";
import { SwotMatrix } from "@/components/SwotMatrix";
import { PdfExportButton } from "@/components/PdfExportButton";
import {
  Sparkles,
  Award,
  Building2,
  Brain,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Bot,
  Loader2,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { InviteParentCard } from "@/components/InviteParentCard";
import { ConsentStep } from "@/components/ConsentStep";
import { api, ApiError } from "@/lib/api";
import type { AnalyzeResponse, CareerPath } from "@/types/api";

const DEFAULT_WEIGHTS: WeightVector = {
  fit: 0.45,
  finance: 0.30,
  market: 0.25,
  alpha: 0.45,
  beta: 0.30,
  gamma: 0.25,
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryResultId = searchParams.get("result_id");
  const isDemo = searchParams.get("demo") === "1";

  // Real backend analysis data state - NO hardcoded INITIAL_ANALYSIS (Comment 3/14)
  const [data, setData] = React.useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorInfo, setErrorInfo] = React.useState<{
    code?: string;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);

  // Names derived strictly from GET /me (Items 5a, 5b, 5c: no hard-coded defaults)
  const [studentName, setStudentName] = React.useState("");
  const [parentName, setParentName] = React.useState("");

  // Missing prerequisites tracking when analysis cannot run yet (Item 3b)
  const [missingPrerequisites, setMissingPrerequisites] = React.useState<{
    role: "student" | "parent";
    hasPair: boolean;
    userAssessmentComplete: boolean;
    userConsented: boolean;
    partnerAssessmentComplete: boolean;
    partnerConsented: boolean;
    questionsRequired?: number;
  } | null>(null);

  // Dynamic weights state for What-If sensitivity recalculation (Comment 5/14 & 9/14)
  const [weights, setWeights] = React.useState<WeightVector>(DEFAULT_WEIGHTS);

  // Store active career by ID, NOT index (Comment 13/14 fix)
  const [selectedCareerId, setSelectedCareerId] = React.useState<string>("");
  const [formattedDate, setFormattedDate] = React.useState("");

  // AI explanation state per career from POST /explain (Item 8)
  const [aiExplanations, setAiExplanations] = React.useState<
    Record<string, { text?: string; source?: string; error?: boolean }>
  >({});
  const [loadingAi, setLoadingAi] = React.useState(false);

  // Tab filtering
  const [activeTab, setActiveTab] = React.useState<
    "roadmap" | "alignment" | "finance" | "market" | "swot"
  >("roadmap");

  const fetchExplanation = React.useCallback(
    async (careerId: string) => {
      if (!data) return;
      setLoadingAi(true);
      try {
        const res = await api.explain({
          result_id: data.resultId,
          career_id: careerId,
        });
        setAiExplanations((prev) => ({
          ...prev,
          [careerId]: {
            text: res.text,
            source: res.source,
          },
        }));
      } catch (err) {
        console.warn("AI explanation fetch failed:", err);
        setAiExplanations((prev) => ({
          ...prev,
          [careerId]: {
            error: true,
          },
        }));
      } finally {
        setLoadingAi(false);
      }
    },
    [data]
  );

  // Load real analysis data from API (Comment 2/14 & 3/14)
  React.useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      setLoading(true);
      setErrorInfo(null);

      try {
        setFormattedDate(
          new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );

        let result: AnalyzeResponse | null = null;

        // Path A: If ?result_id= is present, call GET /results/{id} (Item 3b)
        if (queryResultId) {
          result = await api.getResults(queryResultId);

          if (!isDemo) {
            try {
              const me = await api.getMe();
              const partnerObj = me.partner as { full_name?: string | null } | null;
              if (me.role === "student") {
                setStudentName(me.full_name || "");
                setParentName(partnerObj?.full_name || "your parent");
              } else if (me.role === "parent") {
                setParentName(me.full_name || "");
                setStudentName(partnerObj?.full_name || "your child");
              }
            } catch {
              // Ignore failure in direct result mode
            }
          }
        } else {
          // Path B: Identity discovery via GET /me (do NOT swallow error)
          const me = await api.getMe();

          // Populate names based on me.role (Items 5a, 5b)
          const partnerObj = me.partner as { full_name?: string | null } | null;
          if (me.role === "student") {
            setStudentName(me.full_name || "");
            setParentName(partnerObj?.full_name || "your parent");
          } else if (me.role === "parent") {
            setParentName(me.full_name || "");
            setStudentName(partnerObj?.full_name || "your child");
          }

          if (me.latest_result_id) {
            // me.latest_result_id exists: call GET /results/{latest_result_id}
            result = await api.getResults(me.latest_result_id);
          } else if (
            me.pair &&
            me.progress?.assessment_complete &&
            me.consented &&
            me.partner?.assessment_complete &&
            me.partner?.consented
          ) {
            // Run POST /analyze with pair ids
            result = await api.analyze({
              student_id: me.pair.student_id,
              parent_id: me.pair.parent_id,
              weights: {
                fit: DEFAULT_WEIGHTS.fit,
                finance: DEFAULT_WEIGHTS.finance,
                market: DEFAULT_WEIGHTS.market,
              },
            });
          } else {
            // Otherwise: show status screen listing what is still missing
            if (active) {
              setMissingPrerequisites({
                role: me.role,
                hasPair: Boolean(me.pair),
                userAssessmentComplete: Boolean(me.progress?.assessment_complete),
                userConsented: Boolean(me.consented),
                partnerAssessmentComplete: Boolean(me.partner?.assessment_complete),
                partnerConsented: Boolean(me.partner?.consented),
                questionsRequired: me.progress?.questions_required,
              });
              setLoading(false);
              return;
            }
          }
        }

        if (active && result) {
          setData(result);
          if (result.weights) {
            setWeights({
              fit: result.weights.fit,
              finance: result.weights.finance,
              market: result.weights.market,
              alpha: result.weights.fit,
              beta: result.weights.finance,
              gamma: result.weights.market,
            });
          }
          if (result.roadmap.length > 0) {
            setSelectedCareerId(result.roadmap[0].id);
          }
        }
      } catch (err) {
        if (active) {
          console.error("Analysis load failed:", err);
          if (err instanceof ApiError) {
            setErrorInfo({
              code: err.code,
              message: err.message,
              details: err.details,
            });
          } else {
            setErrorInfo({
              message: "Failed to connect to the PRISM analytics server.",
            });
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalysis();

    return () => {
      active = false;
    };
  }, [queryResultId, isDemo]);

  // Dynamic ranking based on linked weights (Comment 9/14)
  // Keeps viable paths first; recomputes linear blend: w_fit*fit + w_fin*finance + w_market*market
  const rankedRoadmap: CareerPath[] = React.useMemo(() => {
    if (!data) return [];

    const recalculated = data.roadmap.map((c) => {
      const fitScore = c.rawScores.fit;
      const financeScore = c.rawScores.finance;
      const marketScore = c.rawScores.market;

      const blended =
        weights.fit * fitScore +
        weights.finance * financeScore +
        weights.market * marketScore;

      return {
        ...c,
        finalScore: Number((blended * 100).toFixed(1)),
      };
    });

    // Viable paths first, ordered by final score descending
    return recalculated.sort((a, b) => {
      if (a.financeViable !== b.financeViable) {
        return a.financeViable ? -1 : 1;
      }
      return b.finalScore - a.finalScore;
    });
  }, [data, weights]);

  // Active career derived from selectedCareerId (Comment 13/14)
  const activeCareer: CareerPath | undefined =
    rankedRoadmap.find((c) => c.id === selectedCareerId) || rankedRoadmap[0];

  // Request real AI explanation for active career via POST /explain (Item 8)
  React.useEffect(() => {
    if (!activeCareer || !data) return;
    const careerId = activeCareer.id;
    if (aiExplanations[careerId]) return;

    const timer = setTimeout(() => {
      fetchExplanation(careerId);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [activeCareer, data, fetchExplanation, aiExplanations]);

  // Loading State
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4 text-slate-300">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-white">
            Computing Multi-Vector Career Roadmap...
          </p>
          <p className="text-xs text-slate-400">
            Solving financial constraints and scoring regional market velocity
          </p>
        </div>
      </div>
    );
  }

  // Missing Prerequisites Status Screen (Item 3b, Comments 2 & 11)
  if (missingPrerequisites) {
    const isStudent = missingPrerequisites.role === "student";
    const partnerRole = isStudent ? "parent" : "child";

    const items = [
      {
        title: "Your Assessment",
        description: isStudent
          ? `Complete your ${missingPrerequisites.questionsRequired ? `${missingPrerequisites.questionsRequired}-question` : "psychometric"} battery.`
          : "Calibrate your household education budget, savings, and debt limits.",
        complete: missingPrerequisites.userAssessmentComplete,
        action: !missingPrerequisites.userAssessmentComplete ? (
          <Link href={isStudent ? "/assessment/student" : "/assessment/parent"}>
            <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-500">
              Complete Assessment
            </Button>
          </Link>
        ) : null,
      },
      {
        title: `Link With Your ${partnerRole === "parent" ? "Parent" : "Child"}`,
        description: isStudent
          ? "Share your invite code with your parent so they can join your family account."
          : "Enter the student invite code to link your family profile.",
        complete: missingPrerequisites.hasPair,
        action: !missingPrerequisites.hasPair && !isStudent ? (
          <Link href="/parent/join">
            <Button size="sm" variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
              Join Family Link
            </Button>
          </Link>
        ) : null,
      },
      {
        title: `${partnerRole === "parent" ? "Parent" : "Child"}'s Assessment`,
        description: `Waiting for your ${partnerRole} to submit their calibrated assessment profile.`,
        complete: missingPrerequisites.partnerAssessmentComplete,
        action: null,
      },
      {
        title: "Your Data Sharing Consent",
        description: "Explicit permission to compare results while safeguarding private answers.",
        complete: missingPrerequisites.userConsented,
        action: null,
      },
      {
        title: `${partnerRole === "parent" ? "Parent" : "Child"}'s Data Sharing Consent`,
        description: `Waiting for your ${partnerRole} to review and grant cross-generational consent.`,
        complete: missingPrerequisites.partnerConsented,
        action: null,
      },
    ];

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 max-w-2xl mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="cyan">Action Items Required</Badge>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Roadmap Calibration Prerequisites
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            PRISM Engine generates multi-stakeholder roadmaps once both family members have completed their calibrated inputs and granted sharing consent.
          </p>
        </div>

        <div className="w-full space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.complete
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-500 border border-white/10"
                  }`}
                >
                  {item.complete ? "✓" : idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {item.title}
                    {item.complete && (
                      <span className="text-[10px] text-emerald-400 font-mono font-normal">
                        (Completed)
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
              {item.action}
            </div>
          ))}
        </div>

        {/* Inline Consent Step (Comment 2 & 3: reach consent from dashboard) */}
        {!missingPrerequisites.userConsented && (
          <div className="w-full">
            <ConsentStep
              role={missingPrerequisites.role}
              consented={missingPrerequisites.userConsented}
              partnerConsented={missingPrerequisites.partnerConsented}
              onConsentGranted={() => {
                window.location.reload();
              }}
              onConsentWithdrawn={() => {
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Inline Parent Invite Card (Comment 2: reach invite from dashboard) */}
        {isStudent && !missingPrerequisites.hasPair && (
          <div className="w-full">
            <InviteParentCard
              onInviteCreated={() => {
                // Keep local card updated
              }}
            />
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Status
        </Button>
      </div>
    );
  }

  // Error State with error.code branching (Item 3d: keep CONSENT_REQUIRED and ASSESSMENT_INCOMPLETE)
  if (errorInfo || !data) {
    const isConsentRequired = errorInfo?.code === "CONSENT_REQUIRED";
    const isIncomplete = errorInfo?.code === "ASSESSMENT_INCOMPLETE";

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-flex">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white">
            {isConsentRequired
              ? "Dual Consent Required"
              : isIncomplete
              ? "Assessment Incomplete"
              : "Analysis Unavailable"}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isConsentRequired
              ? "Both student and parent must grant consent before the cross-generational conflict analysis can be viewed."
              : isIncomplete
              ? "Please complete all required psychometric questions and financial parameters to generate this roadmap."
              : errorInfo?.message || "Could not retrieve the roadmap."}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {isConsentRequired ? (
            <Button
              onClick={() => router.push("/assessment/student")}
              className="bg-violet-600 hover:bg-violet-500 text-xs"
            >
              Review Consent Status
            </Button>
          ) : isIncomplete ? (
            <Button
              onClick={() => router.push("/assessment/student")}
              className="bg-violet-600 hover:bg-violet-500 text-xs"
            >
              Complete Assessment
            </Button>
          ) : (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="text-xs"
            >
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header Banner (Items 3c, 5c, 6) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-[#121316]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default">MULTI-VECTOR ROADMAP</Badge>
            {isDemo && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold">
                Demo family (sample data)
              </Badge>
            )}
            <span className="text-xs font-mono text-[#75766f]">
              Evaluated: {formattedDate || "Live"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
            Family Career Command Center
          </h1>
          <p className="text-xs text-[#75766f]">
            {!isDemo && (
              <>
                Candidate: <strong className="text-slate-200">{studentName || "—"}</strong>
              </>
            )}
            {data.domainScores?.[0]?.domain && (
              <>
                {!isDemo ? " • " : ""}Best-fit domain:{" "}
                <span className="text-slate-200 font-medium">
                  {data.domainScores[0].domain}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <PdfExportButton
            data={{
              ...data,
              roadmap: rankedRoadmap,
            }}
            studentName={isDemo ? "Demo Student" : (studentName || "Student")}
            parentName={isDemo ? "Demo Parent" : (parentName || "Parent")}
          />

          <Link href="/assessment/student">
            <Button variant="outline" size="sm" className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Retake Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "roadmap"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Top Career Roadmaps ({rankedRoadmap.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alignment")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "alignment"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain className="h-3.5 w-3.5" />
          <span>Alignment &amp; Conflict Index ({data.conflict.index}/100)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("finance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "finance"
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Financial Feasibility</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("market")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "market"
              ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Market Hiring Velocity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("swot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "swot"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>SWOT Diagnostic</span>
        </button>
      </div>

      {/* TAB 1: ROADMAP & WHAT-IF SENSITIVITY */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          {/* Sensitivity Sliders Panel */}
          <WhatIfSliders
            weights={weights}
            onChange={(newW) => setWeights(newW)}
            onReset={() => setWeights(DEFAULT_WEIGHTS)}
          />

          {/* Master-Detail Roadmap Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Ranked Roadmap List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Ranked Paths (Viable First)</span>
                <span>Final Score / 100</span>
              </div>

              <div className="space-y-2">
                {rankedRoadmap.map((career, idx) => {
                  const isSelected = career.id === activeCareer?.id;
                  const rankNumber = idx + 1;

                  return (
                    <div
                      key={career.id}
                      onClick={() => setSelectedCareerId(career.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-violet-950/30 border-violet-500/60 shadow-lg shadow-violet-950/40"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-6 w-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                              rankNumber === 1
                                ? "bg-amber-400 text-slate-950"
                                : rankNumber === 2
                                ? "bg-slate-300 text-slate-950"
                                : rankNumber === 3
                                ? "bg-amber-700 text-white"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            #{rankNumber}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              {career.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">{career.domain}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold text-white">
                            {career.finalScore.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Fit: {career.compositeScore}
                          </span>
                        </div>
                      </div>

                      {/* Mini Stat Badges */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              career.financeViable ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {career.financeViable ? "Affordable" : "Exceeds Limits"}
                        </span>
                        <span>•</span>
                        <span>Demand: {career.marketDemand}%</span>
                        <span>•</span>
                        <span>Exams: {career.rawExams?.length || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: Selected Career Detail Card */}
            {activeCareer && (
              <div className="lg:col-span-7 space-y-4">
                <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <Badge variant="cyan">{activeCareer.domain}</Badge>
                        <CardTitle className="text-xl sm:text-2xl pt-1 text-white">
                          {activeCareer.title}
                        </CardTitle>
                      </div>
                      <div className="flex sm:flex-col items-baseline sm:items-end gap-1">
                        <span className="text-2xl font-black font-mono text-violet-300">
                          {activeCareer.finalScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Harmonized Index / 100
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-4">
                    {/* Capped LLM / Engine Explanation Card (Item 8) */}
                    <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                          <Bot className="h-4 w-4" />
                          <span>Deterministic Decision Explanation</span>
                        </div>
                        {aiExplanations[activeCareer.id]?.source &&
                          !aiExplanations[activeCareer.id]?.error && (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {aiExplanations[activeCareer.id].source}
                            </Badge>
                          )}
                      </div>

                      {loadingAi ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                          <span>Generating synthesis from empirical result metrics...</span>
                        </div>
                      ) : aiExplanations[activeCareer.id]?.error ? (
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-400">Explanation unavailable</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchExplanation(activeCareer.id)}
                            className="h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-950/30"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {aiExplanations[activeCareer.id]?.text ||
                            "Explanation loading from solver..."}
                        </p>
                      )}
                    </div>

                    {/* Entrance Milestones & Institutions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Milestone Exams */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <Award className="h-4 w-4 text-cyan-400" />
                          <span>Key Entrance Milestones</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {activeCareer.exams.length > 0 ? (
                            activeCareer.exams.map((exam, i) => (
                              <li key={i} className="flex items-center justify-between">
                                <span className="font-medium text-white">{exam.name}</span>
                                {exam.date && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {exam.date}
                                  </span>
                                )}
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 text-[11px]">
                              Direct merit &amp; board qualification criteria.
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Representative Institutions */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <Building2 className="h-4 w-4 text-violet-400" />
                          <span>Colleges Evaluated</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {activeCareer.colleges.length > 0 ? (
                            activeCareer.colleges.map((col, i) => (
                              <li key={i} className="flex items-center justify-between">
                                <span className="truncate">{col.name}</span>
                                {col.annualFee && (
                                  <span className="font-mono text-[10px] text-emerald-400 shrink-0">
                                    Rs. {(col.annualFee / 100000).toFixed(1)}L/yr
                                  </span>
                                )}
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 text-[11px]">
                              Multiple accredited state and central universities.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Matched Scholarships */}
                    {activeCareer.scholarships && activeCareer.scholarships.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <DollarSign className="h-4 w-4" />
                          <span>Matched Non-Debt Scholarships</span>
                        </div>
                        <div className="space-y-1.5">
                          {activeCareer.scholarships.map((sch, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/5"
                            >
                              <div className="space-y-0.5">
                                <span className="font-medium text-white block">{sch.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  Rule: {sch.matchedRule}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                                {sch.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALIGNMENT & CONFLICT GAUGE */}
      {activeTab === "alignment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <ConflictGauge conflict={data.conflict} />
          </div>
          <div className="lg:col-span-7">
            <RadarTraitsChart traits={data.traits} scores={data.domainScores} />
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL BREAKDOWN */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <FinanceBreakdownCard financePaths={data.finance} />
        </div>
      )}

      {/* TAB 4: MARKET DEMAND */}
      {activeTab === "market" && (
        <div className="space-y-6">
          <MarketDemandCard marketDataList={data.market} />
        </div>
      )}

      {/* TAB 5: SWOT MATRIX */}
      {activeTab === "swot" && (
        <div className="space-y-6">
          <SwotMatrix swot={data.swot} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-3 text-slate-300">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm">Loading dashboard context...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
