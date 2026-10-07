"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sliders, RotateCcw, Zap } from "lucide-react";

export interface WeightVector {
  fit: number;     // Student psychometric fit weight (default 0.45)
  finance: number; // Financial solvency & ROI weight (default 0.30)
  market: number;  // Market demand & velocity weight (default 0.25)
  // Compatibility aliases
  alpha?: number;
  beta?: number;
  gamma?: number;
}

interface WhatIfSlidersProps {
  weights: WeightVector;
  onChange: (weights: WeightVector) => void;
  onReset: () => void;
}

export function WhatIfSliders({ weights, onChange, onReset }: WhatIfSlidersProps) {
  // Ensure weights sum to 1.0 by adjusting other two sliders proportionally
  const handleLinkedWeightChange = (
    target: "fit" | "finance" | "market",
    newVal: number
  ) => {
    // Clamp newVal to [0.05, 0.90]
    const clampedNew = Math.min(Math.max(newVal, 0.05), 0.90);
    const remaining = 1.0 - clampedNew;

    let other1Key: "fit" | "finance" | "market";
    let other2Key: "fit" | "finance" | "market";

    if (target === "fit") {
      other1Key = "finance";
      other2Key = "market";
    } else if (target === "finance") {
      other1Key = "fit";
      other2Key = "market";
    } else {
      other1Key = "fit";
      other2Key = "finance";
    }

    const currentOther1 = weights[other1Key] || 0.3;
    const currentOther2 = weights[other2Key] || 0.25;
    const sumOther = currentOther1 + currentOther2;

    let newOther1: number;
    let newOther2: number;

    if (sumOther > 0.001) {
      newOther1 = (remaining * currentOther1) / sumOther;
      newOther2 = remaining - newOther1;
    } else {
      newOther1 = remaining / 2;
      newOther2 = remaining / 2;
    }

    const nextFit = Number((target === "fit" ? clampedNew : other1Key === "fit" ? newOther1 : newOther2).toFixed(3));
    const nextFinance = Number((target === "finance" ? clampedNew : other1Key === "finance" ? newOther1 : newOther2).toFixed(3));
    const nextMarket = Number(Math.max(0, 1.0 - nextFit - nextFinance).toFixed(3));

    const updated: WeightVector = {
      fit: nextFit,
      finance: nextFinance,
      market: nextMarket,
      alpha: nextFit,
      beta: nextFinance,
      gamma: nextMarket,
    };

    onChange(updated);
  };

  const fitPct = Math.round((weights.fit ?? weights.alpha ?? 0.45) * 100);
  const financePct = Math.round((weights.finance ?? weights.beta ?? 0.30) * 100);
  const marketPct = Math.max(0, 100 - fitPct - financePct);

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Sliders className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">What-If Multi-Vector Sensitivity Sliders</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-300" />
              Linked Sum = 100%
            </Badge>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              title="Reset default weights"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Dynamically re-rank the roadmap by balancing Student Fit (w_fit) + Family Affordability (w_finance) + Market Hiring Demand (w_market).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fit Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-violet-300">
                Fit: Student Passion / Aptitude
              </span>
              <span className="font-mono font-bold text-white bg-violet-500/20 px-2 py-0.5 rounded">
                {fitPct}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.fit ?? weights.alpha ?? 0.45}
              onChange={(e) => handleLinkedWeightChange("fit", parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Prioritizes student intrinsic strengths and psychometric alignment.
            </p>
          </div>

          {/* Finance Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-300">
                Finance: Family Solvency &amp; ROI
              </span>
              <span className="font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded">
                {financePct}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.finance ?? weights.beta ?? 0.30}
              onChange={(e) => handleLinkedWeightChange("finance", parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Favors lower debt burden, faster break-even, and affordable tuition.
            </p>
          </div>

          {/* Market Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-cyan-300">
                Market: Hiring Velocity &amp; Salary
              </span>
              <span className="font-mono font-bold text-white bg-cyan-500/20 px-2 py-0.5 rounded">
                {marketPct}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.market ?? weights.gamma ?? 0.25}
              onChange={(e) => handleLinkedWeightChange("market", parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Rewards high hiring velocity, starting yield, and regional growth.
            </p>
          </div>
        </div>

        {/* Live Equation Banner */}
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Current Blending Formula:{" "}
            <code className="text-slate-300 font-mono">
              R = {((weights.fit ?? 0.45) * 100).toFixed(0)}%·Fit + {((weights.finance ?? 0.3) * 100).toFixed(0)}%·Finance + {((weights.market ?? 0.25) * 100).toFixed(0)}%·Market
            </code>
          </span>
          <span className="font-mono text-emerald-400 font-semibold">
            Σ Weights = 1.00
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
