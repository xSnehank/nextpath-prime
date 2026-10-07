"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Banknote,
  Users,
  Target,
  GraduationCap,
  Scale,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ChevronDown,
  Layers,
  MapPin,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
} from "lucide-react";

// Interactive Demo Personas for Live Hero Simulator
const SAMPLE_PERSONAS = [
  {
    name: "Aarav Sharma",
    grade: "Grade 11 (PCM)",
    passion: "Software & Robotics",
    budget: 800000,
    topCareer: "Software Engineering",
    score: 86.2,
    breakEven: "1.0 yr",
    conflict: 42,
    conflictLabel: "Moderate",
    exam: "JEE Main / BITSAT",
    scholarship: "INSPIRE Scheme (₹80K/yr)",
  },
  {
    name: "Ananya Iyer",
    grade: "Grade 12 (PCB)",
    passion: "Biomedical & Design",
    budget: 600000,
    topCareer: "Biotechnology & Health Informatics",
    score: 81.4,
    breakEven: "1.4 yrs",
    conflict: 24,
    conflictLabel: "Low",
    exam: "GAT-B / CUET",
    scholarship: "DBT Fellowship (₹31K/mo)",
  },
  {
    name: "Kabir Mehta",
    grade: "Grade 10 (Foundation)",
    passion: "Product & Digital Arts",
    budget: 500000,
    topCareer: "Product & UX Design",
    score: 78.9,
    breakEven: "1.1 yrs",
    conflict: 58,
    conflictLabel: "Moderate",
    exam: "UCEED / NID DAT",
    scholarship: "NID Merit Award (Full Fee)",
  },
];

export default function LandingPage() {
  // Live Simulator State on Landing Page
  const [activePersonaIdx, setActivePersonaIdx] = React.useState(0);
  const [simBudget, setSimBudget] = React.useState(800000);
  const [simConflictToggle, setSimConflictToggle] = React.useState<"low" | "mod" | "high">("mod");
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const activePersona = SAMPLE_PERSONAS[activePersonaIdx];

  const formatInr = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* =========================================================================
          HERO SECTION: Luxury Prismatic Atmosphere with Interactive Simulator
          ========================================================================= */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Prismatic atmospheric glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-violet-600/25 via-indigo-600/20 to-cyan-400/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10 space-y-12">
          {/* Main Title & Problem Badge */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* National Context Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 shadow-sm backdrop-blur-md animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>DataQuest 3.0 • Problem DQNM • PRISM Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-[Outfit,sans-serif] leading-[1.08] animate-fade-in-up">
              Career Guidance That Finally Solves the{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Family Equation
              </span>
            </h1>

            {/* Subtitle with the 90% problem statement */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
              In India, over <strong className="text-white font-semibold">90% of students</strong> lack structured career guidance,
              while parents—the primary financial pillars—are excluded from the process.
              PRISM mathematically harmonizes <strong className="text-violet-300">student psychometrics</strong>,{" "}
              <strong className="text-emerald-300">parental affordability</strong>, and{" "}
              <strong className="text-cyan-300">live macroeconomic job demand</strong> into a ranked, affordable roadmap.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/assessment/student" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 group font-semibold shadow-xl shadow-violet-600/30">
                  <Brain className="h-4 w-4 text-violet-200" />
                  <span>Start Student Assessment</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/assessment/parent" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  <span>Parent Financial Portal</span>
                </Button>
              </Link>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2">
                  <Play className="h-4 w-4 text-cyan-300 fill-cyan-300" />
                  <span>Open Full Dashboard Demo</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* =========================================================================
              INTERACTIVE HERO PREVIEW: Live PRISM Vector Synthesizer Widget
              ========================================================================= */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" className="text-[10px]">
                    Interactive Live Sandbox
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Switch sample student personas to see how PRISM resolves vectors
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-[Outfit,sans-serif]">
                  Tri-Vector Synthesis in Real-Time
                </h3>
              </div>

              {/* Persona selector tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                {SAMPLE_PERSONAS.map((p, idx) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setActivePersonaIdx(idx);
                      setSimBudget(p.budget);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      idx === activePersonaIdx
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {p.name.split(" ")[0]} ({p.grade.split(" ")[1]})
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Input Vectors Flowing Into 1 Output Prism */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
              {/* Input Vector 1: Student Psychometrics */}
              <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold">
                    Vector 1: Psychometrics
                  </span>
                  <Brain className="h-4 w-4 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Student Profile</p>
                  <p className="text-sm font-bold text-white">{activePersona.name}</p>
                  <p className="text-xs text-violet-300 font-medium">{activePersona.passion}</p>
                </div>
                <div className="pt-2 border-t border-violet-500/10 flex justify-between text-xs">
                  <span className="text-slate-400">Aptitude Fit:</span>
                  <span className="font-mono font-bold text-violet-300">88/100</span>
                </div>
              </div>

              {/* Input Vector 2: Parental Constraints */}
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                    Vector 2: Family Limits
                  </span>
                  <Banknote className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Annual Budget</p>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {formatInr(simBudget)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={2000000}
                    step={100000}
                    value={simBudget}
                    onChange={(e) => setSimBudget(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="pt-2 border-t border-emerald-500/10 flex justify-between text-xs">
                  <span className="text-slate-400">Conflict Level:</span>
                  <span className="font-bold text-amber-400">
                    {activePersona.conflict}/100 ({activePersona.conflictLabel})
                  </span>
                </div>
              </div>

              {/* Input Vector 3: Macroeconomic Market Velocity */}
              <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                    Vector 3: Labor Market
                  </span>
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Hub Velocity</p>
                  <p className="text-sm font-bold text-white">Bengaluru &amp; Hyderabad</p>
                  <p className="text-xs text-cyan-300 font-mono">+18% Annual Expansion</p>
                </div>
                <div className="pt-2 border-t border-cyan-500/10 flex justify-between text-xs">
                  <span className="text-slate-400">Median Salary:</span>
                  <span className="font-mono font-bold text-cyan-300">₹14.0L/yr</span>
                </div>
              </div>

              {/* Synthesized Output Result Card */}
              <div className="p-4 rounded-2xl border border-indigo-400/40 bg-gradient-to-b from-indigo-950/40 to-slate-900 space-y-3 relative overflow-hidden ring-1 ring-indigo-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                    PRISM Output
                  </span>
                  <Badge variant="cyan" className="text-[10px]">
                    #1 Ranked
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400">Optimal Viable Path</p>
                  <p className="text-sm font-bold text-white line-clamp-1">{activePersona.topCareer}</p>
                  <p className="text-xs font-mono text-emerald-400">Break-even: {activePersona.breakEven}</p>
                </div>
                <div className="pt-1.5 border-t border-white/10 space-y-1 text-[11px]">
                  <p className="text-slate-300 truncate">Exams: {activePersona.exam}</p>
                  <p className="text-cyan-300 truncate font-medium">Aid: {activePersona.scholarship}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE CRISIS IN NUMBERS: 90% Guidance Deficit & Economic Blindspots
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-950/80 border-y border-white/5 relative">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="danger">Systemic Educational Failure</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-[Outfit,sans-serif]">
              Why Indian Career Decision-Making is Broken
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Without empirical data, career choices become high-stakes family gambles driven by peer pressure,
              geographic opacity, and financial blindspots.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-2">
              <span className="text-4xl font-extrabold text-rose-400 font-[Outfit,sans-serif]">
                &gt;90%
              </span>
              <h3 className="text-sm font-bold text-white">Guidance Void</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Over 90% of Indian students have zero access to standardized psychometric analysis or verified counselor pipelines.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-2">
              <span className="text-4xl font-extrabold text-amber-400 font-[Outfit,sans-serif]">
                ₹25L+
              </span>
              <h3 className="text-sm font-bold text-white">Debt Trap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Families take on unsustainable loans for degrees with 5+ year break-even horizons, risking catastrophic default.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-2">
              <span className="text-4xl font-extrabold text-violet-400 font-[Outfit,sans-serif]">
                74%
              </span>
              <h3 className="text-sm font-bold text-white">Family Friction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parents are excluded from the evaluation until tuition bills arrive, creating deep domestic conflict over risk and location.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-2">
              <span className="text-4xl font-extrabold text-cyan-400 font-[Outfit,sans-serif]">
                68%
              </span>
              <h3 className="text-sm font-bold text-white">Underemployment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Graduates end up underemployed because colleges fail to match skill development with regional economic hiring demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE PRISM SOLUTION: 4 Core Pillars Bento Grid
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="cyan">Engine Architecture</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-[Outfit,sans-serif]">
              How the Multi-Vector Algorithmic Engine Works
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every roadmap is generated through transparent mathematical vectorization and constraint solving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Card 1: Conflict Index Gauge */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  Parent-Student Conflict Index (0-100)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates mean absolute deviation across risk appetite, budget tolerance, and geographic mobility.
                  Identifies the top 3 friction points and highlights actionable compromises before commitments are made.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Friction Level:</span>
                  <span className="font-bold text-amber-400">42 / 100 (Negotiable)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 w-[42%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Bento Card 2: Financial Constraint Solver */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Banknote className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  Financial Constraint Solver
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates 4-year tuition, family liquid share, loan debt, and post-grad net starting salary.
                  Automatically rejects paths exceeding family debt comfort and suggests cheaper STEAM alternatives.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-300">Software Eng. (Viable):</span>
                  <span className="text-emerald-300 font-bold">1.0 yr Break-even</span>
                </div>
                <div className="flex justify-between font-mono text-rose-300">
                  <span>MBBS Private (Over-budget):</span>
                  <span className="font-bold">5.6 yrs Break-even</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Dynamic Regional Labor Signals */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  Geographic Labor Velocity
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connects student skills with verified regional demand indices and median compensations across Bengaluru,
                  Hyderabad, Pune, NCR, and emerging tier-2 technology corridors.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-cyan-400" /> Bengaluru AI/ML:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">+22% Growth (95/100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-cyan-400" /> Pune UX/Design:
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">₹8.0L Entry</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Psychometric Vectorization */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-violet-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  30-Question Psychometrics
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Measures Aptitude (A), Interest (I), and Cognitive Style (C) normalized from 0 to 100 across 8 Indian career domains.
                  Features automatic pause &amp; resume in browser storage.
                </p>
              </div>

              <div className="font-mono text-[11px] text-violet-300 bg-violet-950/40 p-2.5 rounded-xl border border-violet-500/20 text-center">
                S_d = w_a·A_d + w_i·I_d + w_c·C_d
              </div>
            </div>

            {/* Bento Card 5: Entrance Exam & NIRF College Roadmap */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  Entrance Exams &amp; NIRF Benchmark
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maps top careers with national entrance schedules (JEE, NEET, NID, CUET) and top 3 NIRF-ranked institutions
                  so students know the exact academic milestones required.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-white/5 text-[11px] text-slate-300 font-mono">
                  IIT Bombay
                </span>
                <span className="px-2 py-1 rounded-lg bg-white/5 text-[11px] text-slate-300 font-mono">
                  BITS Pilani
                </span>
                <span className="px-2 py-1 rounded-lg bg-white/5 text-[11px] text-slate-300 font-mono">
                  NID Ahmedabad
                </span>
              </div>
            </div>

            {/* Bento Card 6: Matched Financial Aid & Scholarships */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4 backdrop-blur-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                  Scholarship Discovery
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identifies 3+ verified scholarships per career pathway, detailing eligibility criteria and application deadlines
                  to bridge parental financial shortfalls.
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                <span className="text-slate-300 font-medium">INSPIRE Award</span>
                <span className="font-mono text-emerald-400 font-bold">₹80,000 / yr</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE 3-STEP COLLABORATIVE WORKFLOW: Student + Parent + Market
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-950/80 border-y border-white/5">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <Badge variant="cyan">Zero-Conflict Journey</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-[Outfit,sans-serif]">
              3 Steps From Confusion to Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A private, collaborative protocol designed to bring families together rather than pull them apart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 space-y-4 relative">
              <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white font-mono font-bold flex items-center justify-center text-base shadow-lg shadow-violet-600/30">
                01
              </div>
              <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                Student Takes Test
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Student completes ~30 quick questions (one per screen) assessing logic, interests, and cognitive problem-solving.
                Answers auto-save and generate an invite link for their parents.
              </p>
              <Link href="/assessment/student" className="inline-flex items-center gap-1 text-xs text-violet-400 font-semibold hover:underline">
                Take Student Assessment →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 space-y-4 relative">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-base shadow-lg shadow-emerald-600/30">
                02
              </div>
              <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                Parent Enters Limits
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parent joins via invite link and enters annual educational budget, liquid savings, loan comfort, and ranks top 3 hoped-for career domains in rupees.
              </p>
              <Link href="/assessment/parent" className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline">
                Open Parent Form →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 space-y-4 relative">
              <div className="h-10 w-10 rounded-2xl bg-cyan-600 text-white font-mono font-bold flex items-center justify-center text-base shadow-lg shadow-cyan-600/30">
                03
              </div>
              <h3 className="text-lg font-bold text-white font-[Outfit,sans-serif]">
                Unified Roadmap
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Both profiles unlock together to reveal the Parent-Student Conflict Index, Financial Constraint Solver, top 5 ranked roadmaps, and downloadable PDF report.
              </p>
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-cyan-400 font-semibold hover:underline">
                View Sample Roadmap →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE FAQ: Transparency & Ethical AI
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="cyan">Frequently Asked Questions</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-[Outfit,sans-serif]">
              Methodology &amp; Ethical Guardrails
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built with deterministic mathematical algorithms to prevent AI hallucinations in high-stakes family decisions.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Why does PRISM use deterministic code instead of asking ChatGPT or Claude for career advice?",
                a: "High-stakes educational choices require 100% reproducible, explainable mathematics. LLMs frequently hallucinate college fees, salary averages, and eligibility rules. In PRISM, scoring (R_d = α·S_d + β·F_d + γ·M_d) and financial solvency checks run entirely on deterministic Python/FastAPI code. AI is strictly leveraged for plain-language narrative synthesis.",
              },
              {
                q: "How does the Parent-Student Conflict Index protect student autonomy?",
                a: "Neither the student's individual answers nor the parent's financial entries are visible to the other party until both complete their assessments. Once linked, the engine highlights friction points (e.g. Risk Appetite divergence) constructively, shifting family conversations from emotional arguments to objective, budget-backed compromises.",
              },
              {
                q: "Where does the regional hiring velocity and salary data come from?",
                a: "The market demand layer aggregates curated industry hiring benchmarks from NASSCOM, LinkedIn hiring velocity datasets, and national labor reports, stamped with provenance and benchmark dates across India's primary and emerging tech corridors.",
              },
              {
                q: "Can the family adjust the weights if their priorities change?",
                a: "Yes! The roadmap dashboard includes live What-If sensitivity sliders allowing parents and students to adjust the emphasis placed on intrinsic passion (α), financial limits (β), and market demand (γ). The rankings recalculate client-side in under 0.1 seconds.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-cyan-400" : "text-slate-400"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pt-3 text-xs text-slate-300 leading-relaxed border-t border-white/5 mt-3 animate-fade-in-up">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HIGH-IMPACT CALL TO ACTION
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/15 bg-gradient-to-r from-violet-950/80 via-slate-900/90 to-cyan-950/80 p-8 sm:p-14 backdrop-blur-2xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span>Ready for Review &amp; Evaluation</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-[Outfit,sans-serif] leading-tight">
            Stop Guessing. Build Your Family’s Verified Career Roadmap.
          </h2>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Experience the complete PRISM Engine workflow with our pre-calibrated sample family or start fresh.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="glow" className="gap-2 font-semibold shadow-xl shadow-cyan-600/25">
                <Play className="h-4 w-4 fill-white" />
                <span>Launch Sample Family Demo</span>
              </Button>
            </Link>

            <Link href="/assessment/student">
              <Button variant="outline" size="lg" className="border-white/20 text-white">
                Take Student Assessment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
