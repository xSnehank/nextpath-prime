"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sliders, RotateCcw, Zap } from "lucide-react";

export interface WeightVector {
  alpha: number; // Student psychometrics weight (default 0.45)
  beta: number;  // Financial viability weight (default 0.30)
  gamma: number; // Market demand weight (default 0.25)
  maxLoan: number; // in INR
  annualBudget: number; // in INR
}

interface WhatIfSlidersProps {
  weights: WeightVector;
  onChange: (weights: WeightVector) => void;
  onReset: () => void;
}

export function WhatIfSliders({ weights, onChange, onReset }: WhatIfSlidersProps) {
  const handleWeightChange = (field: keyof WeightVector, val: number) => {
    onChange({
      ...weights,
      [field]: val,
    });
  };

  const formatInr = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

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
              Recalculates in &lt; 0.1s
            </Badge>
            <button
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
          Dynamically adjust model weights (α Psychometrics + β Affordability + γ Market Velocity = 1.0) and see roadmap rearrange instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Alpha Slider */}
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-violet-300">
                α Student Passion / Aptitude
              </span>
              <span className="font-mono font-bold text-white bg-violet-500/20 px-2 py-0.5 rounded">
                {(weights.alpha * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.alpha}
              onChange={(e) => handleWeightChange("alpha", parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Prioritizes student intrinsic strengths over market yield.
            </p>
          </div>

          {/* Beta Slider */}
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-300">
                β Financial Affordability
              </span>
              <span className="font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded">
                {(weights.beta * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.beta}
              onChange={(e) => handleWeightChange("beta", parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Boosts careers with lowest tuition and shortest break-even.
            </p>
          </div>

          {/* Gamma Slider */}
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-cyan-300">
                γ Industry & Market Demand
              </span>
              <span className="font-mono font-bold text-white bg-cyan-500/20 px-2 py-0.5 rounded">
                {(weights.gamma * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.gamma}
              onChange={(e) => handleWeightChange("gamma", parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Boosts high-growth fields and high-velocity geographic hiring.
            </p>
          </div>
        </div>

        {/* Dynamic Budget & Loan Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Household Annual Budget</span>
              <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                {formatInr(weights.annualBudget)}
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max="2500000"
              step="50000"
              value={weights.annualBudget}
              onChange={(e) => handleWeightChange("annualBudget", parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Max Loan Tolerance</span>
              <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                {formatInr(weights.maxLoan)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4000000"
              step="100000"
              value={weights.maxLoan}
              onChange={(e) => handleWeightChange("maxLoan", parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
