"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";

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

  const sliders = [
    { key: "fit" as const, label: "Fit with the student", value: weights.fit ?? weights.alpha ?? 0.45 },
    { key: "finance" as const, label: "Affordability", value: weights.finance ?? weights.beta ?? 0.3 },
    { key: "market" as const, label: "Job demand", value: weights.market ?? weights.gamma ?? 0.25 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">What matters most to you? The list re-orders as you move these.</p>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {sliders.map((slider) => (
          <label key={slider.key} className="space-y-1.5">
            <span className="flex justify-between text-sm">
              <span>{slider.label}</span>
              <span className="font-mono text-muted-foreground">{Math.round(slider.value * 100)}%</span>
            </span>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={slider.value}
              onChange={(e) => handleLinkedWeightChange(slider.key, parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
