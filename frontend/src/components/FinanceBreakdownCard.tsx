"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, AlertCircle, CheckCircle, ArrowRightCircle } from "lucide-react";
import type { FinancePath } from "@/types/api";

interface FinanceBreakdownCardProps {
  financePaths: FinancePath[];
}

export function FinanceBreakdownCard({ financePaths }: FinanceBreakdownCardProps) {
  // Format Indian currency representation (e.g. ₹12,00,000 or ₹12L)
  const formatInr = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakh`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Banknote className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">Financial Constraint Solver</CardTitle>
          </div>
          <Badge variant="cyan">Multi-Year ROI & Debt Modeling</Badge>
        </div>
        <CardDescription className="text-xs">
          Compares 4-year tuition & living costs against family savings, loan tolerance, and net starting yield.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 pb-2">
                <th className="py-2.5 px-3 font-semibold">Career Pathway</th>
                <th className="py-2.5 px-3 font-semibold">4-Yr Total Cost</th>
                <th className="py-2.5 px-3 font-semibold">Family Share</th>
                <th className="py-2.5 px-3 font-semibold">Loan Required</th>
                <th className="py-2.5 px-3 font-semibold">Starting Salary</th>
                <th className="py-2.5 px-3 font-semibold">Break-Even</th>
                <th className="py-2.5 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {financePaths.map((path) => (
                <tr
                  key={path.careerId}
                  className={`group transition-colors ${
                    path.isViable
                      ? "hover:bg-white/[0.03]"
                      : "bg-rose-950/15 hover:bg-rose-950/25"
                  }`}
                >
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                    {path.isViable ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>{path.careerName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatInr(path.totalCost4Year)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatInr(path.familyShare)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {path.loanNeeded > 0 ? (
                      <span className="text-amber-400 font-semibold">
                        {formatInr(path.loanNeeded)}
                      </span>
                    ) : (
                      <span className="text-slate-500">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                    {formatInr(path.expectedStartingSalary)}/yr
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    <span className="bg-white/5 px-2 py-0.5 rounded font-bold">
                      {path.breakEvenYears.toFixed(1)} yrs
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {path.isViable ? (
                      <Badge variant="success" className="text-[10px]">
                        Affordable
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px]">
                        Over Budget
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Flagged paths callout */}
        {financePaths.some((p) => !p.isViable) && (
          <div className="space-y-2 pt-2">
            {financePaths
              .filter((p) => !p.isViable)
              .map((p) => (
                <div
                  key={p.careerId}
                  className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-rose-300 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>Financial Warning: {p.careerName}</span>
                  </div>
                  <p className="text-slate-400 pl-6">
                    {p.failReason || "Exceeds declared household annual budget and maximum loan tolerance."}
                  </p>
                  {p.cheaperAlternative && (
                    <div className="flex items-center gap-2 pl-6 pt-1 text-cyan-300">
                      <ArrowRightCircle className="h-3.5 w-3.5 text-cyan-400" />
                      <span>
                        Recommended STEAM Pivot: <strong className="text-white">{p.cheaperAlternative}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
