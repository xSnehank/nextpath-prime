"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { FinancePath } from "@/types/api";

interface FinanceBreakdownCardProps {
  financePaths: FinancePath[];
}

/** ₹3.4 lakh, ₹1.20 Cr, or ₹45,000. */
export function formatInr(amount: number | null | undefined): string {
  if (!amount) return "₹0";
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} lakh`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Cost, what the family can pay, the loan and the payback time for each career on the plan. */
export function FinanceBreakdownCard({ financePaths }: FinanceBreakdownCardProps) {
  return (
    <div className="space-y-3">
      {financePaths.map((path) => {
        const viable = path.viable ?? path.isViable;
        const stats = [
          { label: "Total cost", value: formatInr(path.totalCost ?? path.totalCost4Year) },
          { label: "Family can pay", value: formatInr(path.capacity ?? path.familyShare) },
          { label: "Loan needed", value: formatInr(path.loanNeeded) },
          { label: "Pays back in", value: `${(path.breakEvenYears ?? 0).toFixed(1)} yrs` },
        ];
        return (
          <div key={path.careerId} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{path.careerName}</h3>
              <Badge variant={viable ? "success" : "danger"}>{viable ? "Affordable" : "Over budget"}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
            {!viable && path.failReason && <p className="mt-3 text-xs text-danger">{path.failReason}</p>}
            {path.cheaperAlternative && <p className="mt-1 text-xs text-muted-foreground">Cheaper option: {path.cheaperAlternative}</p>}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">Costs include fees and living costs for the whole course, minus any scholarship you qualify for.</p>
    </div>
  );
}
