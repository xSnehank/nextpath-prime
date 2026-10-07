import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoFamilyButton } from "@/components/DemoFamilyButton";
import {
  Compass,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Banknote,
  Users,
  Target,
  GraduationCap,
  Scale,
  Brain,
  FileCheck2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Prismatic radial backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-indigo-500/15 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-12 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 shadow-sm backdrop-blur-md animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>PRISM ENGINE • DataQuest 3.0 (Problem DQNM)</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-[Outfit,sans-serif] leading-[1.1] animate-fade-in-up">
            Turning Student Aptitude & Parent Budgets into a{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Ranked, Affordable Roadmap
            </span>
          </h1>

          {/* 90% Problem Statement Callout */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            In India, over <strong className="text-white">90% of students</strong> lack structured career guidance,
            while parents—the primary financial decision-makers—are excluded from the evaluation.
            PRISM bridges this with a mathematical multi-vector solver.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 sm:pt-6">
            <Link href="/assessment/student" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 group font-semibold shadow-xl shadow-violet-600/30">
                <span>Start Student Assessment</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/assessment/parent" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Parent Financial Form</span>
              </Button>
            </Link>

            <div className="w-full sm:w-auto">
              <DemoFamilyButton
                size="lg"
                label="Launch Sample Family Demo"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Trust stats pill */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-white/5 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-400" />
              <span>30-Question Psychometrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-400" />
              <span>Parent Conflict Index (C2)</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-400" />
              <span>4-Yr Debt & ROI Solver (D1)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span>Live Regional Market Signals</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid (Bento Style) */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-950/60 border-y border-white/5">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-[Outfit,sans-serif]">
              Algorithmic Multi-Vector Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No generic questionnaires. Every recommendation is scored through deterministic linear weighting and financial constraint verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 backdrop-blur-xl hover:border-violet-500/40 transition-all">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-[Outfit,sans-serif]">
                1. Student Psychometrics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vectorizes 30 indicators across aptitude (A), interest (I), and cognitive style (C) across 8 Indian career domains.
              </p>
              <div className="text-[11px] font-mono text-violet-300 bg-violet-950/40 px-2 py-1 rounded border border-violet-500/20">
                S_d = w_a·A_d + w_i·I_d + w_c·C_d
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 backdrop-blur-xl hover:border-amber-500/40 transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-[Outfit,sans-serif]">
                2. Conflict Index (0-100)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes mean absolute divergence between student goals and parental budget, risk tolerance, and geographic constraints.
              </p>
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/20">
                Low (&lt;30) • Mod (30-60) • High (&gt;60)
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 backdrop-blur-xl hover:border-emerald-500/40 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Banknote className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-[Outfit,sans-serif]">
                3. Financial Solver
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates 4-year tuition, loan needs, expected entry salary, and break-even years. Flags over-budget options with cheaper STEAM pivots.
              </p>
              <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                Total Cost ≤ Budget + Loan
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 backdrop-blur-xl hover:border-cyan-500/40 transition-all">
              <div className="h-10 w-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-[Outfit,sans-serif]">
                4. Actionable Roadmap
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Top 5 ranked careers with JEE/NEET/NID exams, top 3 NIRF colleges, 3+ matched scholarships, and plain-language reasoning.
              </p>
              <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20">
                R_d = α·S_d + β·F_d + γ·M_d
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Workflow Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 sm:p-12 backdrop-blur-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <span>Fast-Track Evaluation</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white font-[Outfit,sans-serif]">
            Try the Complete PRISM Flow in Under 10 Seconds
          </h2>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Judges and reviewers can load a pre-configured sample Indian family (Grade 11 PCM student &amp; parent with ₹8L annual budget) to immediately review the scoring engine, charts, and PDF download.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <DemoFamilyButton size="lg" label="Open Sample Family Roadmap" />
            <Link href="/signup">
              <Button variant="outline" size="lg">
                Create Fresh Student Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
