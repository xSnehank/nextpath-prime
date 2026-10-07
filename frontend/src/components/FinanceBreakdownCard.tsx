"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, AlertCircle, CheckCircle } from "lucide-react";
import type { FinancePath } from "@/types/api";

interface FinanceBreakdownCardProps {
  financePaths: FinancePath[];
}

export function FinanceBreakdownCard({ financePaths }: FinanceBreakdownCardProps) {
  // Format Indian currency representation (e.g. Rs. 14.2 Lakh or Rs. 1.42 Cr)
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
          <Badge variant="cyan">ROI &amp; Debt Solvency</Badge>
        </div>
        <CardDescription className="text-xs">
          Compares total tuition &amp; living costs against family savings capacity, loan threshold, and net entry yield.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 pb-2">
                <th className="py-2.5 px-3 font-semibold">Career Pathway</th>
                <th className="py-2.5 px-3 font-semibold">Total Cost</th>
                <th className="py-2.5 px-3 font-semibold">Family Share</th>
                <th className="py-2.5 px-3 font-semibold">Loan Required</th>
                <th className="py-2.5 px-3 font-semibold">Starting Salary</th>
                <th className="py-2.5 px-3 font-semibold">Break-Even</th>
                <th className="py-2.5 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {financePaths.map((path) => {
                const isViable = path.viable ?? path.isViable;
                const totalCost = path.totalCost ?? path.totalCost4Year;
                const familyShare = path.capacity ?? path.familyShare;
                const salary = path.startingSalary ?? path.expectedStartingSalary;
                const breakeven = path.breakEvenYears ?? 0;

                return (
                  <tr
                    key={path.careerId}
                    className={`group transition-colors ${
                      isViable
                        ? "hover:bg-white/[0.03]"
                        : "bg-rose-950/15 hover:bg-rose-950/25"
                    }`}
                  >
                    <td className="py-3 px-3 font-medium text-white flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {isViable ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>{path.careerName}</span>
                      </div>
                      {!isViable && path.failReason && (
                        <span className="text-[10px] text-rose-300 pl-5.5 font-normal">
                          {path.failReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatInr(totalCost)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatInr(familyShare)}
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
                      {formatInr(salary)}/yr
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <span className="bg-white/5 px-2 py-0.5 rounded font-bold">
                        {breakeven.toFixed(1)} yrs
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isViable ? (
                        <Badge variant="success" className="text-[10px]">
                          Affordable
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px]">
                          Exceeds Limits
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend / Methodology notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Solvent: Fits family budget &amp; max loan limit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Non-Viable: Violates debt threshold or break-even tolerance
            </span>
          </div>
          <span className="font-mono text-slate-500">
            Formula: B_y = Total Cost / (Starting Salary − Living Costs)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
