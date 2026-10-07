"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  Building2,
  Brain,
  Sliders,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Bot,
  Loader2,
  ChevronRight,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { AnalyzeResponse, CareerPath } from "@/types/api";

function DashboardContent() {
  const searchParams = useSearchParams();
  const queryResultId = searchParams.get("result_id");

  // Real backend analysis data state - NO hardcoded INITIAL_ANALYSIS (Comment 3/14)
  const [data, setData] = React.useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorInfo, setErrorInfo] = React.useState<{
    code?: string;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);

  const [studentName, setStudentName] = React.useState("Aarav Sharma");
  const [parentName, setParentName] = React.useState("Rajesh Sharma");

  // Dynamic weights state for What-If sensitivity recalculation (Comment 5/14 & 9/14)
  const defaultWeights: WeightVector = {
    fit: 0.45,
    finance: 0.30,
    market: 0.25,
    alpha: 0.45,
    beta: 0.30,
    gamma: 0.25,
  };
  const [weights, setWeights] = React.useState<WeightVector>(defaultWeights);

  // Store active career by ID, NOT index (Comment 13/14 fix)
  const [selectedCareerId, setSelectedCareerId] = React.useState<string>("");
  const [formattedDate, setFormattedDate] = React.useState("");

  // AI explanation state per career from POST /explain (Comment 4/14 fix)
  const [aiExplanations, setAiExplanations] = React.useState<
    Record<string, { text: string; source: string }>
  >({});
  const [loadingAi, setLoadingAi] = React.useState(false);

  // Tab filtering
  const [activeTab, setActiveTab] = React.useState<
    "roadmap" | "alignment" | "finance" | "market" | "swot"
  >("roadmap");

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

        const sName = localStorage.getItem("prism_student_name");
        const pName = localStorage.getItem("prism_parent_name");
        if (sName) setStudentName(sName);
        if (pName) setParentName(pName);

        let result: AnalyzeResponse | null = null;

        // Path A: Direct result_id provided in query params (e.g. from demo/run or saved link)
        if (queryResultId) {
          result = await api.getResults(queryResultId);
        } else {
          // Path B: Identity discovery via GET /me
          try {
            const me = await api.getMe();
            if (me.full_name) setStudentName(me.full_name);

            if (me.latest_result_id) {
              result = await api.getResults(me.latest_result_id);
            } else if (me.pair && me.progress.assessment_complete) {
              // Run POST /analyze
              result = await api.analyze({
                student_id: me.pair.student_id,
                parent_id: me.pair.parent_id,
                weights: {
                  fit: defaultWeights.fit,
                  finance: defaultWeights.finance,
                  market: defaultWeights.market,
                },
              });
            }
          } catch (meErr) {
            console.warn("GET /me did not resolve existing pair:", meErr);
          }

          // Path C: If no result yet, launch demo run to provide working sandbox
          if (!result) {
            const demoRes = await api.runDemo();
            result = await api.getResults(demoRes.result_id);
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
  }, [queryResultId]);

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

  // Request real AI explanation for active career via POST /explain (Comment 4/14)
  const handleFetchAiExplanation = async (career: CareerPath) => {
    if (!data || !career) return;
    if (aiExplanations[career.id]) return;

    setLoadingAi(true);
    try {
      const res = await api.explain({
        result_id: data.resultId,
        career_id: career.id,
      });

      setAiExplanations((prev) => ({
        ...prev,
        [career.id]: {
          text: res.text,
          source: res.source,
        },
      }));
    } catch (err) {
      console.warn("AI explanation fetch failed:", err);
      // Fallback only cites deterministic scores
      setAiExplanations((prev) => ({
        ...prev,
        [career.id]: {
          text: `${career.title} achieves a final score of ${career.finalScore}/100 based on ${career.compositeScore}/100 psychometric affinity and ${career.marketDemand}% regional market demand.`,
          source: "cache",
        },
      }));
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    if (activeCareer && data) {
      handleFetchAiExplanation(activeCareer);
    }
  }, [activeCareer?.id, data?.resultId]);

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

  // Error State with error.code branching (Comment 11/14)
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
              onClick={() => routerPush("/assessment/student")}
              className="bg-violet-600 hover:bg-violet-500 text-xs"
            >
              Review Consent Status
            </Button>
          ) : isIncomplete ? (
            <Button
              onClick={() => routerPush("/assessment/student")}
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
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-[#121316]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default">MULTI-VECTOR ROADMAP</Badge>
            <span className="text-xs font-mono text-[#75766f]">
              Evaluated: {formattedDate || "Live"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
            Family Career Command Center
          </h1>
          <p className="text-xs text-[#75766f]">
            Candidate: <strong className="text-slate-200">{studentName}</strong> • Domicile: Maharashtra • Primary Aspirant Focus: Engineering &amp; Technology
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <PdfExportButton
            data={{
              ...data,
              roadmap: rankedRoadmap,
            }}
            studentName={studentName}
            parentName={parentName}
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
            onReset={() => setWeights(defaultWeights)}
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
                    {/* Capped LLM / Engine Explanation Card (Comment 4/14 fix) */}
                    <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                          <Bot className="h-4 w-4" />
                          <span>Deterministic Decision Explanation</span>
                        </div>
                        {aiExplanations[activeCareer.id] && (
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

function routerPush(href: string) {
  if (typeof window !== "undefined") {
    window.location.href = href;
  }
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
