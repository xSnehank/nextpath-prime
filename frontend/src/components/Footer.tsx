import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#08090a] text-[#75766f] py-16 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16181b] border border-white/10">
                <span className="h-2 w-2 rounded-full bg-[#d4ff3a]" />
              </div>
              <span className="text-base font-bold text-[#eeeee8] tracking-tight">
                Next<span className="text-[#d4ff3a]">Path</span>
              </span>
            </div>
            <p className="text-sm text-[#75766f] max-w-md leading-relaxed">
              Eliminating India&apos;s 90% structured career guidance deficit through deterministic multi-vector intelligence: harmonizing psychometrics, parental solvency, and live macroeconomic demand.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-[#75766f] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d4ff3a]" />
                Zero-Key Browser Safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                DQNM Engine
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#eeeee8] mb-4">
              Engine Modules
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/assessment/student" className="hover:text-[#d4ff3a] transition-colors flex items-center gap-1 group">
                  <span>Student Assessment</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/assessment/parent" className="hover:text-[#d4ff3a] transition-colors flex items-center gap-1 group">
                  <span>Parent Solvency Vector</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#d4ff3a] transition-colors flex items-center gap-1 group">
                  <span>Conflict Index Gauge (C2)</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#d4ff3a] transition-colors flex items-center gap-1 group">
                  <span>Financial Solver (D1)</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture / Team */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#eeeee8] mb-4">
              System Context
            </h4>
            <ul className="space-y-2.5 text-xs text-[#75766f]">
              <li>DataQuest 3.0 • Problem DQNM</li>
              <li>Frontend Lead: Aayush</li>
              <li>Backend & Scoring: Snehank</li>
              <li>Architecture: Tri-Vector Resolution</li>
              <li className="pt-2 text-[11px] text-[#75766f]/80">
                Next.js 16 • Tailwind CSS v4 • TypeScript
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#75766f] gap-4">
          <p className="font-mono text-[11px]">© 2026 NextPath. Built for DataQuest 3.0.</p>
          <p className="italic text-[11px]">
            Psychometric and financial vectors are computed deterministically per the PRD specification.
          </p>
        </div>
      </div>
    </footer>
  );
}
