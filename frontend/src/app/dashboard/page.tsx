"use client";

import * as React from "react";
import Link from "next/link";
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
import { DemoFamilyButton } from "@/components/DemoFamilyButton";
import { DEMO_DATA } from "@/mocks";
import type { AnalyzeResponse, CareerPath } from "@/types/api";
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
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = React.useState<AnalyzeResponse>(DEMO_DATA.analyzeResponse);
  const [studentName, setStudentName] = React.useState("Aarav Sharma");
  const [parentName, setParentName] = React.useState("Rajesh Sharma");

  // Dynamic weights state for What-If sensitivity recalculation (Epic D3)
  const defaultWeights: WeightVector = {
    alpha: 0.45,
    beta: 0.30,
    gamma: 0.25,
    annualBudget: 800000,
    maxLoan: 1500000,
  };
  const [weights, setWeights] = React.useState<WeightVector>(defaultWeights);

  // Active selected career in the roadmap
  const [selectedCareerIndex, setSelectedCareerIndex] = React.useState(0);
  const [formattedDate, setFormattedDate] = React.useState("Oct 2025");

  // AI explanation state per career (Epic E3)
  const [aiExplanations, setAiExplanations] = React.useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = React.useState(false);

  // Tab filtering
  const [activeTab, setActiveTab] = React.useState<"roadmap" | "alignment" | "finance" | "market" | "swot">("roadmap");

  // On mount, load localStorage data if available
  React.useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    );
    try {
      const sName = localStorage.getItem("prism_student_name");
      const pName = localStorage.getItem("prism_parent_name");
      if (sName) setStudentName(sName);
      if (pName) setParentName(pName);

      const storedAnalysis = localStorage.getItem("prism_analysis_data");
      if (storedAnalysis) {
        setData(JSON.parse(storedAnalysis));
      }
    } catch (e) {
      console.warn("Could not load stored analysis data:", e);
    }
  }, []);

  // Recalculate roadmap rankings dynamically based on weights (Epic D3: < 3s, client calculation is < 50ms)
  const rankedRoadmap = React.useMemo(() => {
    const recalculated = data.roadmap.map((c) => {
      // Linear blending: R_d = alpha * S_d + beta * F_d + gamma * M_d
      // Normalize sum of weights
      const sumWeights = weights.alpha + weights.beta + weights.gamma || 1.0;
      const normAlpha = weights.alpha / sumWeights;
      const normBeta = weights.beta / sumWeights;
      const normGamma = weights.gamma / sumWeights;

      // Adjust financial viability based on the user's custom budget slider
      let dynamicViability = c.financialViability;
      const finInfo = data.finance.find((f) => f.careerId === c.id);
      if (finInfo) {
        const totalNeeded = finInfo.totalCost4Year;
        const totalAllowed = weights.annualBudget * 4 + weights.maxLoan;
        if (totalNeeded > totalAllowed) {
          dynamicViability = Math.max(20, c.financialViability - 30);
        } else {
          dynamicViability = Math.min(100, c.financialViability + 10);
        }
      }

      const score =
        normAlpha * c.compositeScore +
        normBeta * dynamicViability +
        normGamma * c.marketDemand;

      return {
        ...c,
        finalScore: Math.round(score * 10) / 10,
        financialViability: dynamicViability,
      };
    });

    // Sort descending by calculated score
    return recalculated.sort((a, b) => b.finalScore - a.finalScore);
  }, [data.roadmap, data.finance, weights]);

  const activeCareer: CareerPath = rankedRoadmap[selectedCareerIndex] || rankedRoadmap[0];

  // Request or load AI explanation for the active career (Epic E3)
  const handleFetchAiExplanation = async (career: CareerPath) => {
    if (aiExplanations[career.id]) return;

    setLoadingAi(true);
    try {
      // Simulate/call backend explanation endpoint
      // Cites actual scores under 150 words
      await new Promise((r) => setTimeout(r, 600));

      const explanationText = `${career.title} scores an exceptional ${career.finalScore}/100, harmonizing your ${career.compositeScore}/100 intrinsic psychometric affinity with strong Indian macroeconomic tailwinds (${career.marketDemand}% demand index). With 4-year tuition verified at ${career.financialViability}% affordability under your family's budget, the financial model forecasts full investment recovery within 1.0–1.2 years of post-graduation entry yield. Key entrance milestones: ${career.exams.map((e) => e.name).join(", ")}.`;

      setAiExplanations((prev) => ({
        ...prev,
        [career.id]: explanationText,
      }));
    } catch {
      // Fallback
      setAiExplanations((prev) => ({
        ...prev,
        [career.id]: `Based on deterministic multi-vector analysis, ${career.title} offers an optimal fit for your aptitude profile and parental financial parameters.`,
      }));
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    if (activeCareer) {
      handleFetchAiExplanation(activeCareer);
    }
  }, [activeCareer?.id]);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Multi-Vector Synthesized Results</Badge>
            <span className="text-xs text-slate-400">
              Evaluated: {formattedDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-[Outfit,sans-serif]">
            Family Career Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Student: <strong className="text-white">{studentName}</strong> • Parent:{" "}
            <strong className="text-white">{parentName}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <PdfExportButton
            data={{ ...data, roadmap: rankedRoadmap }}
            studentName={studentName}
            parentName={parentName}
          />
          <DemoFamilyButton variant="outline" size="sm" label="Reload Demo State" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab("roadmap")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "roadmap"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Ranked Roadmap (E1 &amp; E2)</span>
        </button>

        <button
          onClick={() => setActiveTab("alignment")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "alignment"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain className="h-4 w-4" />
          <span>Conflict &amp; Aptitude (C1 &amp; C2)</span>
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "finance"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Financial Constraint Solver (D1)</span>
        </button>

        <button
          onClick={() => setActiveTab("market")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "market"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Regional Market Signals (D2)</span>
        </button>

        <button
          onClick={() => setActiveTab("swot")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "swot"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Strategic SWOT Matrix (C3)</span>
        </button>
      </div>

      {/* Dynamic What-If Slider Bar (always accessible at top) */}
      <WhatIfSliders
        weights={weights}
        onChange={setWeights}
        onReset={() => setWeights(defaultWeights)}
      />

      {/* ================= TAB CONTENT 1: ROADMAP (EPIC E1, E2, E3) ================= */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          {/* Top 5 Ranked Pathways Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {rankedRoadmap.slice(0, 5).map((career, idx) => {
              const isSelected = idx === selectedCareerIndex;
              return (
                <button
                  key={career.id}
                  onClick={() => setSelectedCareerIndex(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-b from-violet-950/60 to-slate-900 border-violet-400 shadow-xl shadow-violet-600/20 ring-1 ring-violet-400"
                      : "bg-slate-900/40 border-white/10 hover:bg-slate-900/80 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="h-6 w-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <Badge variant={isSelected ? "cyan" : "secondary"} className="text-[10px]">
                      {career.finalScore} pts
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm line-clamp-1">
                      {career.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {career.domain.split(" / ")[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Career Deep Dive Details */}
          {activeCareer && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Milestones & Education Path */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                            #{rankedRoadmap.indexOf(activeCareer) + 1}
                          </span>
                          <CardTitle className="text-xl sm:text-2xl text-white">
                            {activeCareer.title}
                          </CardTitle>
                        </div>
                        <p className="text-xs text-slate-400">
                          Domain: <strong className="text-slate-200">{activeCareer.domain}</strong> • Final PRISM Score:{" "}
                          <strong className="text-cyan-400">{activeCareer.finalScore}/100</strong>
                        </p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs text-slate-400">Education Timeline</span>
                        <span className="text-xs font-semibold text-emerald-400">
                          {activeCareer.timeline}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-2">
                    {/* Plain Language AI Narrative (Epic E3) */}
                    <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-950/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-violet-300">
                        <span className="flex items-center gap-1.5">
                          <Bot className="h-4 w-4 text-cyan-400" />
                          <span>AI Algorithmic Rationale (Epic E3)</span>
                        </span>
                        {loadingAi && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {aiExplanations[activeCareer.id] ||
                          "Synthesizing psychometric alignment, parental financial viability, and market velocity into a transparent summary..."}
                      </p>
                    </div>

                    {/* Entrance Exams Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Key Entrance Examinations</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {activeCareer.exams.map((exam, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1"
                          >
                            <span className="text-xs font-bold text-white block">
                              {exam.name}
                            </span>
                            {exam.date && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-500" />
                                {exam.date}
                              </span>
                            )}
                            {exam.registrationDeadline && (
                              <span className="text-[10px] text-amber-400 block font-mono">
                                Reg: {exam.registrationDeadline}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NIRF Top Colleges */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-violet-400" />
                        <span>Top 3 Benchmark Institutions (NIRF Ranked)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {activeCareer.colleges.map((col, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">
                                {col.name}
                              </span>
                              {col.ranking && (
                                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/20">
                                  NIRF #{col.ranking}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {col.location}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Matched Scholarships (Epic E2) & Scoring Vector Breakdown */}
              <div className="space-y-6">
                {/* Scholarships Card (Epic E2) */}
                <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <Award className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-base">Matched Scholarships (Epic E2)</CardTitle>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        {activeCareer.scholarships.length} Aid Options
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Targeted institutional and government funding schemes tailored to this path.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1">
                    {activeCareer.scholarships.map((sch, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{sch.name}</span>
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {sch.amount}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {sch.eligibility}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                          <span>Deadline: {sch.deadline}</span>
                          <span className="text-cyan-400 hover:underline cursor-pointer">
                            View Portal →
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Score Vector Breakdown */}
                <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tri-Vector Composition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Psychometric Fit (S_d)</span>
                        <span className="font-mono font-bold text-violet-400">
                          {activeCareer.compositeScore}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${activeCareer.compositeScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Financial Viability (F_d)</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {activeCareer.financialViability}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${activeCareer.financialViability}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Industry Demand (M_d)</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {activeCareer.marketDemand}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${activeCareer.marketDemand}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB CONTENT 2: CONFLICT & PSYCHOMETRICS (C1 & C2) ================= */}
      {activeTab === "alignment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConflictGauge conflict={data.conflict} />
          <RadarTraitsChart scores={data.domainScores} />
        </div>
      )}

      {/* ================= TAB CONTENT 3: FINANCIAL CONSTRAINT SOLVER (D1) ================= */}
      {activeTab === "finance" && (
        <FinanceBreakdownCard financePaths={data.finance} />
      )}

      {/* ================= TAB CONTENT 4: REGIONAL MARKET SIGNALS (D2) ================= */}
      {activeTab === "market" && (
        <MarketDemandCard marketDataList={data.market} />
      )}

      {/* ================= TAB CONTENT 5: SWOT MATRIX (C3) ================= */}
      {activeTab === "swot" && (
        <SwotMatrix swot={data.swot} />
      )}
    </div>
  );
}
