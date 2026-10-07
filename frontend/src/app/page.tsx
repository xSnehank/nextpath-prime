"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ArrowUpRight,
  Brain,
  Banknote,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileText,
} from "lucide-react";

// Interactive Demo Personas for Live Simulator
interface Persona {
  id: string;
  name: string;
  grade: string;
  tagline: string;
  defaultBudget: number;
  topCareer: string;
  domainScore: number;
  financialFit: number;
  marketScore: number;
  compositeScore: number;
  conflictIndex: number;
  conflictBand: "Low" | "Moderate" | "Elevated";
  breakEvenYears: number;
  loanRequired: number;
  recommendedExam: string;
  scholarship: string;
  studentFocus: string;
  parentFocus: string;
}

const PERSONAS: Persona[] = [
  {
    id: "aarav",
    name: "Aarav Sharma",
    grade: "Grade 11 • PCM",
    tagline: "Software Architecture & Robotics",
    defaultBudget: 800000,
    topCareer: "Software Engineering & Systems",
    domainScore: 92,
    financialFit: 84,
    marketScore: 88,
    compositeScore: 88.6,
    conflictIndex: 38,
    conflictBand: "Moderate",
    breakEvenYears: 1.1,
    loanRequired: 350000,
    recommendedExam: "JEE Main / BITSAT",
    scholarship: "INSPIRE Scheme (₹80K/yr)",
    studentFocus: "Cutting-edge robotics & AI engineering",
    parentFocus: "Safe Tier-1 campus placement with low debt",
  },
  {
    id: "ananya",
    name: "Ananya Iyer",
    grade: "Grade 12 • PCB",
    tagline: "Biotechnology & Health Informatics",
    defaultBudget: 650000,
    topCareer: "Computational Biology & Diagnostics",
    domainScore: 89,
    financialFit: 78,
    marketScore: 84,
    compositeScore: 83.9,
    conflictIndex: 22,
    conflictBand: "Low",
    breakEvenYears: 1.4,
    loanRequired: 400000,
    recommendedExam: "GAT-B / CUET Bio / NEET",
    scholarship: "DBT Bio-Fellowship (₹31K/mo)",
    studentFocus: "Research lab immersion & genomics",
    parentFocus: "Structured 5-year timeline with stable clinical career",
  },
  {
    id: "kabir",
    name: "Kabir Mehta",
    grade: "Grade 10 • Foundation",
    tagline: "Digital Product & Interaction Design",
    defaultBudget: 500000,
    topCareer: "UX & Enterprise Product Systems",
    domainScore: 86,
    financialFit: 72,
    marketScore: 82,
    compositeScore: 80.2,
    conflictIndex: 54,
    conflictBand: "Moderate",
    breakEvenYears: 1.2,
    loanRequired: 450000,
    recommendedExam: "UCEED / NID DAT",
    scholarship: "NID Merit-Cum-Means (Full Waiver)",
    studentFocus: "Digital interface craft & human-computer interaction",
    parentFocus: "High starting CTC and job security in private sector",
  },
];

const CRISIS_ITEMS = [
  {
    index: "01",
    tag: "GEOGRAPHIC & ADVICE VOID",
    title: "Over 90% of Indian students lack structured career guidance",
    description:
      "Most families make million-rupee educational decisions based on hearsay from relatives, aggressive coaching advertisements, or peer panic. The result is oversaturation in generic streams and massive career mismatch.",
    stat: ">90%",
    statLabel: "Guidance Deficit in India",
  },
  {
    index: "02",
    tag: "THE PARENT EXCLUSION PARADOX",
    title: "Parents fund 85%+ of education, yet are excluded from counselling",
    description:
      "Existing psychometric tests only speak to the student, pretending tuition is free. NextPath bridges the generational divide by treating parental solvency, loan limits, and retirement security as primary mathematical constraints.",
    stat: "85%+",
    statLabel: "Tuition Funded by Parents",
  },
  {
    index: "03",
    tag: "CURRICULUM-MARKET LAG",
    title: "Obsolete college curricula create an acute employability crisis",
    description:
      "Over 1.5 million engineers graduate annually in India, but fewer than 20% are employable for modern industry roles. NextPath ingests live macroeconomic market demand data to rank fields by real hiring growth and AI resilience.",
    stat: "1.5M+",
    statLabel: "Annual STEM Graduates",
  },
  {
    index: "04",
    tag: "UNRESOLVED DOMESTIC FRICTION",
    title: "Passion versus security leads to costly household paralysis",
    description:
      "Without an objective arbitrator, disagreements between student dreams and parental risk appetite stall decisions or force costly compromises. Our Parent-Student Conflict Index (C2) isolates specific value gaps and surfaces mutually viable paths.",
    stat: "42%",
    statLabel: "Avg. Parent-Student Conflict",
  },
];

const FAQS = [
  {
    q: "How is NextPath different from typical AI-generated career tests?",
    a: "Standard tests use generic chat prompts or simple personality quizzes that ignore real-world constraints. NextPath is a deterministic intelligence engine: it executes a formal multi-vector mathematical formula blending student RIASEC psychometrics, parental financial affordability (total degree cost, EMIs, break-even), and live job-market growth indices into a ranked, verified roadmap.",
  },
  {
    q: "How does the Parent Portal work without invading the student's privacy?",
    a: "The student takes their 30-question psychometric assessment independently. A unique pairing link or WhatsApp invite is generated for the parent to declare family educational budget, risk appetite, and loan tolerance. NextPath's Conflict Index compares the two vector spaces objectively, identifying points of friction without turning into an adversarial confrontation.",
  },
  {
    q: "What data sources power the macroeconomic job market signals?",
    a: "Our engine tracks industry hiring datasets across major Indian tech hubs (Bangalore, Pune, Hyderabad, NCR) incorporating 5-year CAGR projections, entry-level CTC benchmarks, and AI-automation risk ratings to ensure recommended roadmaps remain viable over the student's graduation horizon.",
  },
  {
    q: "Can we test the platform immediately without filling 30 questions?",
    a: "Yes. Click 'Live Demo' in the navbar or select any of the pre-configured sample family personas in our simulator below to launch an instant end-to-end dossier complete with radar charts, financial break-even models, and downloadable PDF reports.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = React.useState("aarav");
  const [budgetSlider, setBudgetSlider] = React.useState(800000);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [launchingDemo, setLaunchingDemo] = React.useState(false);

  const handleLaunchDemo = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLaunchingDemo(true);
    try {
      const res = await api.runDemo();
      router.push(`/dashboard?result_id=${res.result_id}&demo=1`);
    } catch (err) {
      console.error("Live demo launch failed:", err);
      alert(err instanceof ApiError ? err.message : "Failed to launch live demo. Please ensure the backend is running.");
    } finally {
      setLaunchingDemo(false);
    }
  };

  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];

  // Adjust break-even & loan dynamically based on slider
  const simulatedCost = 1150000;
  const simulatedLoan = Math.max(0, simulatedCost - budgetSlider);
  const dynamicBreakEven = (
    simulatedLoan > 0
      ? 0.9 + (simulatedLoan / 400000) * 0.4
      : 0.6
  ).toFixed(1);

  const formatLakhs = (val: number) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-[#08090a] text-[#eeeee8] selection:bg-[#d4ff3a] selection:text-[#08090a] overflow-x-hidden">
      {/* =========================================================================
          01. HERO SECTION: Minimalist Obsidian Ground, Tight Editorial Typography,
              Reachwise Volt Accents & Pill Buttons
          ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        {/* Subtle hairline grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10 space-y-10">
          {/* Status Pill Badge */}
          <div className="flex items-center justify-start">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-[#121316] px-3.5 py-1.5 text-xs">
              <span className="ping-dot" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#dcdcd3]">
                DATAQUEST 3.0 • PROBLEM DQNM • MULTI-VECTOR RESOLUTION
              </span>
            </div>
          </div>

          {/* Hero Editorial Headline */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#eeeee8] leading-[1.02]">
              Career intelligence re-engineered for the{" "}
              <span className="text-[#d4ff3a]">family equation.</span>
            </h1>
            <p className="text-base sm:text-xl text-[#75766f] leading-relaxed max-w-3xl">
              Over 90% of Indian students lack structured guidance, while parental financial limits are systematically ignored. NextPath mathematically unifies{" "}
              <span className="text-[#eeeee8]">student psychometrics</span>,{" "}
              <span className="text-[#d4ff3a]">parental affordability</span>, and{" "}
              <span className="text-[#eeeee8]">live job-market demand</span> into a single ranked, debt-conscious roadmap.
            </p>
          </div>

          {/* Reachwise Signature Pill Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={launchingDemo}
              className="rw-pill-btn rw-pill-solid"
            >
              <span>{launchingDemo ? "Loading Demo..." : "Launch 1-Click Demo Family"}</span>
              <span className="rw-arrow-chip">
                <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </span>
            </button>

            <Link href="/assessment/student" className="rw-pill-btn rw-pill-ghost">
              <span>Start Student Assessment</span>
              <span className="rw-arrow-chip">
                <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </span>
            </Link>

            <Link href="/assessment/parent" className="rw-pill-btn rw-pill-ghost">
              <span>Parent Solvency Portal</span>
              <span className="rw-arrow-chip">
                <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </span>
            </Link>
          </div>

          {/* Macro Data Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-white/[0.08]">
            <div className="space-y-1">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
                90<span className="text-[#d4ff3a]">%+</span>
              </div>
              <div className="text-xs font-mono text-[#75766f] uppercase tracking-wider">
                Unstructured Guidance Void
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
                ₹18.4<span className="text-[#d4ff3a]">L</span>
              </div>
              <div className="text-xs font-mono text-[#75766f] uppercase tracking-wider">
                Average Middle-Class Degree Cost
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
                42<span className="text-[#d4ff3a]">%</span>
              </div>
              <div className="text-xs font-mono text-[#75766f] uppercase tracking-wider">
                Parent-Student Goal Conflict
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#eeeee8] tracking-tight">
                0.0<span className="text-[#d4ff3a]">s</span>
              </div>
              <div className="text-xs font-mono text-[#75766f] uppercase tracking-wider">
                Deterministic Solver Latency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. INTERACTIVE REACHWISE-STYLE SANDBOX SIMULATOR
          Directly interactive on the landing page — proves immediate utility
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] bg-[#0d0e10]">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-[#d4ff3a]">
                {"// 01 LIVE SIMULATION ENGINE"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#eeeee8]">
                Test the Tri-Vector Equation
              </h2>
              <p className="text-sm text-[#75766f] max-w-xl">
                Switch real student profiles and adjust parental financial liquidity to watch the algorithm re-balance live break-even horizons and conflict metrics.
              </p>
            </div>

            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#d4ff3a] hover:underline">
              <span>View Full Diagnostic Suite</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Interactive Sandbox Card */}
          <div className="editorial-card p-6 sm:p-8 space-y-8">
            {/* Persona Switchers */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#75766f]">
                Select Verified Family Persona:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PERSONAS.map((persona) => {
                  const isSelected = persona.id === selectedPersonaId;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        setSelectedPersonaId(persona.id);
                        setBudgetSlider(persona.defaultBudget);
                      }}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#16181b] border-[#d4ff3a] text-[#eeeee8]"
                          : "bg-[#08090a]/50 border-white/[0.06] text-[#75766f] hover:border-white/20 hover:text-[#eeeee8]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-[#eeeee8]">
                          {persona.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#d4ff3a]">
                          {persona.grade}
                        </span>
                      </div>
                      <p className="text-xs text-[#75766f] truncate">
                        {persona.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider & Value Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-white/[0.08]">
              {/* Left Column: Sliders and Inputs */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[#75766f] uppercase font-mono tracking-wider">
                      Annual Family Educational Budget
                    </span>
                    <span className="font-mono font-bold text-[#d4ff3a] text-sm">
                      {formatLakhs(budgetSlider)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={2500000}
                    step={50000}
                    value={budgetSlider}
                    onChange={(e) => setBudgetSlider(Number(e.target.value))}
                    className="w-full accent-[#d4ff3a] bg-[#16181b] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-[#75766f] mt-1">
                    <span>₹2.0L (Frugal)</span>
                    <span>₹12.0L (Mid)</span>
                    <span>₹25.0L (Affluent)</span>
                  </div>
                </div>

                {/* Perspective Divergence Readout */}
                <div className="space-y-3 bg-[#08090a] p-4 rounded-xl border border-white/[0.06]">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#75766f]">
                    Perspective Vectors:
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d4ff3a] mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[#eeeee8] font-medium">Student Aspiration: </span>
                        <span className="text-[#75766f]">{activePersona.studentFocus}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[#eeeee8] font-medium">Parent Constraint: </span>
                        <span className="text-[#75766f]">{activePersona.parentFocus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Algorithm Output */}
              <div className="lg:col-span-7 bg-[#16181b] p-6 rounded-2xl border border-white/[0.08] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#75766f]">
                      Deterministic Recommendation
                    </span>
                    <h3 className="text-lg font-bold text-[#eeeee8] mt-0.5">
                      {activePersona.topCareer}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#75766f]">
                      NextPath Index
                    </span>
                    <div className="text-xl font-mono font-bold text-[#d4ff3a]">
                      {activePersona.compositeScore}/100
                    </div>
                  </div>
                </div>

                {/* 4 Key Engine Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 bg-[#08090a] p-3 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-[#75766f]">
                      Psychometric Fit
                    </span>
                    <div className="font-mono text-base font-bold text-[#eeeee8]">
                      {activePersona.domainScore}%
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#08090a] p-3 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-[#75766f]">
                      Loan Required
                    </span>
                    <div className="font-mono text-base font-bold text-[#eeeee8]">
                      {simulatedLoan > 0 ? formatLakhs(simulatedLoan) : "₹0 (Zero Debt)"}
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#08090a] p-3 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-[#75766f]">
                      Break-Even Horizon
                    </span>
                    <div className="font-mono text-base font-bold text-[#d4ff3a]">
                      {dynamicBreakEven} yrs
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#08090a] p-3 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-[#75766f]">
                      Conflict Index
                    </span>
                    <div className="font-mono text-base font-bold text-[#eeeee8]">
                      {activePersona.conflictIndex}
                      <span className="text-[10px] text-[#75766f] font-normal ml-1">
                        ({activePersona.conflictBand})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roadmapping details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#08090a] border border-white/[0.04]">
                    <FileText className="h-4 w-4 text-[#d4ff3a] shrink-0" />
                    <div>
                      <span className="text-[#75766f] text-[10px] font-mono block">GATEWAY EXAM:</span>
                      <span className="text-[#eeeee8] font-medium">{activePersona.recommendedExam}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#08090a] border border-white/[0.04]">
                    <Sparkles className="h-4 w-4 text-[#d4ff3a] shrink-0" />
                    <div>
                      <span className="text-[#75766f] text-[10px] font-mono block">NON-DEBT SCHOLARSHIP:</span>
                      <span className="text-[#eeeee8] font-medium">{activePersona.scholarship}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] transition-colors"
                  >
                    <span>Inspect Full Dossier in Dashboard</span>
                    <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03. THE CRISIS GRID: Editorial 4-Card Analysis of the Indian Education Reality
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-[#d4ff3a]">
              {"// 02 THE CRISIS"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#eeeee8]">
              Why Indian Career Decisions Break Down
            </h2>
            <p className="text-sm sm:text-base text-[#75766f] max-w-2xl">
              Traditional counselling focuses solely on aspirations while ignoring household solvency. The current system produces predictable failure modes across middle-class families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CRISIS_ITEMS.map((item) => (
              <div
                key={item.index}
                className="editorial-card p-6 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#d4ff3a] tracking-widest">
                      [{item.index}]
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#75766f] border border-white/10 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#eeeee8] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#75766f] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-bold text-[#eeeee8] tracking-tight">
                    {item.stat}
                  </span>
                  <span className="text-xs font-mono text-[#75766f] uppercase">
                    {item.statLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          04. TRI-VECTOR MATHEMATICAL FRAMEWORK
          Deterministic calculation, no black-box hallucinations
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] bg-[#0d0e10]">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-[#d4ff3a]">
              {"// 03 MATHEMATICAL FRAMEWORK"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#eeeee8]">
              Deterministic Multi-Vector Synthesis
            </h2>
            <p className="text-sm sm:text-base text-[#75766f] max-w-2xl">
              NextPath operates as a pure deterministic engine. Every score and recommendation is derived through transparent, reproducible mathematical equations.
            </p>
          </div>

          {/* Formula Display Box */}
          <div className="editorial-card p-6 sm:p-8 font-mono text-center space-y-4 border-[#d4ff3a]/30">
            <div className="text-xs uppercase tracking-widest text-[#75766f]">
              Core Composite Ranking Function (PRD Section 4.2)
            </div>
            <div className="text-xl sm:text-3xl font-bold text-[#d4ff3a] tracking-tight overflow-x-auto py-2">
              R_d = α · S_d + β · F_d + γ · M_d − δ · C_p
            </div>
            <div className="text-xs text-[#75766f] max-w-xl mx-auto font-sans">
              Where α = 0.40 (Psychometrics), β = 0.35 (Financial Solvency), γ = 0.25 (Market Demand), with δ penalizing severe parent-student divergence.
            </div>
          </div>

          {/* 3 Pillars of the Tri-Vector Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vector 1 */}
            <div className="editorial-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#d4ff3a]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#eeeee8]">
                  Vector 01: S_d
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#eeeee8]">
                Student Psychometrics
              </h3>
              <p className="text-xs text-[#75766f] leading-relaxed">
                30 adaptive questions calibrated across Holland RIASEC taxonomy and Big 5 personality traits. Yields a 6-dimensional trait vector measuring analytical rigor, artistic inclination, and technical curiosity.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#d4ff3a]">
                • Holland RIASEC Profile
                <br />
                • Big 5 OCEAN Distribution
              </div>
            </div>

            {/* Vector 2 */}
            <div className="editorial-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-[#d4ff3a]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#eeeee8]">
                  Vector 02: F_d
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#eeeee8]">
                Financial Constraint Solver
              </h3>
              <p className="text-xs text-[#75766f] leading-relaxed">
                Evaluates total 4-year degree cost against parental disposable savings and maximum debt tolerance. Calculates required loan collateral, interest drag, and estimated break-even period in years.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#d4ff3a]">
                • 4-Year Tuition & Living Model
                <br />
                • Break-Even Horizon (&lt;2 Years Target)
              </div>
            </div>

            {/* Vector 3 */}
            <div className="editorial-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#d4ff3a]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#eeeee8]">
                  Vector 03: M_d
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#eeeee8]">
                Macroeconomic Demand
              </h3>
              <p className="text-xs text-[#75766f] leading-relaxed">
                Live signals tracking industry hiring growth across Bangalore, Hyderabad, Pune, and Gurgaon. Accounts for 5-year CAGR, starting CTC brackets, and automation vulnerability.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#d4ff3a]">
                • Regional Tech Salary Indices
                <br />
                • AI Vulnerability & CAGR 2024-2030
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          05. BENTO SYSTEM CAPABILITIES (Reachwise-Style Clean Bento)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-[#d4ff3a]">
              {"// 04 SYSTEM MODULES"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#eeeee8]">
              Engineered for End-to-End Decision Clarity
            </h2>
            <p className="text-sm sm:text-base text-[#75766f] max-w-2xl">
              Four specialized sub-systems work in unison to transform raw family survey data into an actionable roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento 1: Conflict Index (Large 7 cols) */}
            <div className="md:col-span-7 editorial-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#d4ff3a]">
                  MODULE C2
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#75766f] border border-white/10 px-2 py-0.5 rounded-full">
                  OBJECTIVE MEDIATION
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#eeeee8] tracking-tight">
                Parent-Student Conflict Gauge
              </h3>
              <p className="text-sm text-[#75766f] leading-relaxed">
                Measures Euclidean divergence between student aspirations and parental risk tolerance across 4 primary friction axes: Prestige, Financial Safety, Geographic Mobility, and Work-Life Equilibrium.
              </p>

              {/* Visual Conflict Gauge Simulation */}
              <div className="bg-[#08090a] p-4 rounded-xl border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#eeeee8]">Aggregate Friction Score:</span>
                  <span className="text-[#d4ff3a] font-bold">38 / 100 (Moderate Alignment)</span>
                </div>
                <div className="w-full bg-[#16181b] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#d4ff3a] h-full rounded-full" style={{ width: "38%" }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#75766f]">
                  <span>0 (Total Harmony)</span>
                  <span>50 (Negotiable)</span>
                  <span>100 (Acute Paralysis)</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Financial Solver (5 cols) */}
            <div className="md:col-span-5 editorial-card p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#d4ff3a]">
                    MODULE D1
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#75766f] border border-white/10 px-2 py-0.5 rounded-full">
                    SOLVENCY MODEL
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#eeeee8] tracking-tight">
                  Financial Constraint Solver
                </h3>
                <p className="text-xs text-[#75766f] leading-relaxed">
                  Calculates true multi-year cost of degrees, modeling student loan repayments, EMI burdens, and projected time-to-break-even against starting Tier-1 and Tier-2 compensation.
                </p>
              </div>

              <div className="bg-[#08090a] p-3 rounded-xl border border-white/[0.06] text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-[#75766f]">
                  <span>4-Yr Tuition + Living:</span>
                  <span className="text-[#eeeee8]">₹11.5L</span>
                </div>
                <div className="flex justify-between text-[#75766f]">
                  <span>Estimated Break-Even:</span>
                  <span className="text-[#d4ff3a] font-bold">1.1 Years</span>
                </div>
              </div>
            </div>

            {/* Bento 3: What-If Slider Engine (5 cols) */}
            <div className="md:col-span-5 editorial-card p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#d4ff3a]">
                    MODULE S3
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#75766f] border border-white/10 px-2 py-0.5 rounded-full">
                    SENSITIVITY
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#eeeee8] tracking-tight">
                  Dynamic &quot;What-If&quot; Sliders
                </h3>
                <p className="text-xs text-[#75766f] leading-relaxed">
                  Allows families to dynamically simulate alternative life scenarios: What if we take a ₹5L loan? What if the student qualifies for a 50% merit scholarship? The roadmap re-ranks immediately.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#d4ff3a]">
                <Sliders className="h-4 w-4" />
                <span>Instant Parametric Recalculation</span>
              </div>
            </div>

            {/* Bento 4: PDF Export & Dossier (7 cols) */}
            <div className="md:col-span-7 editorial-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#d4ff3a]">
                  MODULE E4
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#75766f] border border-white/10 px-2 py-0.5 rounded-full">
                  PORTABLE ASSET
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#eeeee8] tracking-tight">
                Family Executive Dossier (PDF Export)
              </h3>
              <p className="text-sm text-[#75766f] leading-relaxed">
                Generates a clean, client-side vector PDF report containing radar charts, verified entrance exam deadlines (JEE, BITSAT, UCEED, CUET), and scholarship application paths for easy family discussion.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#08090a] bg-[#d4ff3a] hover:bg-[#bcf01a] px-3.5 py-1.5 rounded-full font-semibold transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Test Live PDF Export in Demo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06. EDITORIAL FAQ SECTION: Clean Accordion, Monospace indices
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] bg-[#0d0e10]">
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-[#d4ff3a]">
              {"// 05 FREQUENTLY ASKED QUESTIONS"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#eeeee8]">
              System Specifications & FAQ
            </h2>
            <p className="text-sm sm:text-base text-[#75766f]">
              Direct answers regarding mathematical modeling, parent onboarding, and security.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="editorial-card overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#d4ff3a]">
                        {`// 0${idx + 1}`}
                      </span>
                      <span className="font-semibold text-sm sm:text-base text-[#eeeee8]">
                        {faq.q}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#d4ff3a] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#75766f] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#75766f] leading-relaxed border-t border-white/[0.06]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          07. HIGH-IMPACT FINAL CTA BANNER: Reachwise Oversized Obsidian Box
          ========================================================================= */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="editorial-card p-8 sm:p-16 text-center space-y-8 relative overflow-hidden border-[#d4ff3a]/25 bg-gradient-to-b from-[#121316] to-[#08090a]">
            {/* Subtle volt flare */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#d4ff3a]/10 blur-[90px] pointer-events-none" />

            <div className="space-y-4 max-w-3xl mx-auto relative z-10">
              <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#d4ff3a] border border-[#d4ff3a]/30 px-3 py-1 rounded-full bg-[#d4ff3a]/5">
                READY TO SOLVE YOUR FAMILY EQUATION?
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#eeeee8] leading-[1.05]">
                Replace career guesswork with mathematical precision.
              </h2>
              <p className="text-sm sm:text-base text-[#75766f] max-w-xl mx-auto">
                No subscription. No arbitrary counselor bias. A verified, ranked roadmap calibrated in under 10 minutes.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 relative z-10">
              <button
                type="button"
                onClick={handleLaunchDemo}
                disabled={launchingDemo}
                className="rw-pill-btn rw-pill-solid"
              >
                <span>{launchingDemo ? "Loading Demo..." : "Launch Instant Demo Family"}</span>
                <span className="rw-arrow-chip">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </span>
              </button>

              <Link href="/assessment/student" className="rw-pill-btn rw-pill-ghost">
                <span>Start Student Test (~10 min)</span>
                <span className="rw-arrow-chip">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </span>
              </Link>

              <Link href="/assessment/parent" className="rw-pill-btn rw-pill-ghost">
                <span>Parent Financial Portal</span>
                <span className="rw-arrow-chip">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
