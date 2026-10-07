import Link from "next/link";
import { Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-950">
                  <Compass className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-base font-bold text-white font-[Outfit,sans-serif]">
                PRISM ENGINE
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Addressing India&apos;s 90% structured career guidance void by harmonizing
              student psychometric traits, parental financial realities, and live macroeconomic job
              demand into reproducible, viable roadmaps.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Zero-Key Browser Safe
              </span>
              <span className="flex items-center gap-1">
                <HeartHandshake className="h-3.5 w-3.5 text-cyan-400" />
                Parent-Student Alignment
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-[Outfit,sans-serif]">
              Engine Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/assessment/student" className="hover:text-cyan-400 transition-colors">
                  Student Assessment (~30 Qs)
                </Link>
              </li>
              <li>
                <Link href="/assessment/parent" className="hover:text-cyan-400 transition-colors">
                  Parent Financial Vectors
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Conflict Index Gauge (C2)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Financial Constraint Solver (D1)
                </Link>
              </li>
            </ul>
          </div>

          {/* Competition Context */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-[Outfit,sans-serif]">
              Team & Event
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>DataQuest 3.0 (Problem DQNM)</li>
              <li>Frontend Lead: Aayush</li>
              <li>Backend & Scoring: Snehank</li>
              <li>DB & Systems Lead: Member 3</li>
              <li className="text-xs text-slate-400 pt-2">
                Built with Next.js, TypeScript & Antigravity
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2025 PRISM Engine. Built for DataQuest 3.0 Hackathon.</p>
          <p className="italic">
            Psychometric vectors are indicative and transparently calculated via deterministic formula.
          </p>
        </div>
      </div>
    </footer>
  );
}
