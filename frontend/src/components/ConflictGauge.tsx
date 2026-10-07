"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import type { ConflictResult } from "@/types/api";

interface ConflictGaugeProps {
  conflict: ConflictResult;
}

export function ConflictGauge({ conflict }: ConflictGaugeProps) {
  const { index, label, topDisagreements } = conflict;

  // Determine colors & styling based on index (under 30 low, 30-60 mod, >60 high)
  const getLabelConfig = () => {
    if (index < 30) {
      return {
        badgeVariant: "success" as const,
        badgeText: "Low Conflict (Harmonious)",
        color: "#10b981", // Emerald
        textColor: "text-emerald-400",
        bgLight: "bg-emerald-500/10",
        icon: CheckCircle2,
        description: "Student aspirations and parental parameters align strongly.",
      };
    }
    if (index <= 60) {
      return {
        badgeVariant: "warning" as const,
        badgeText: "Moderate Friction (Negotiable)",
        color: "#f59e0b", // Amber
        textColor: "text-amber-400",
        bgLight: "bg-amber-500/10",
        icon: AlertTriangle,
        description: "Key differences exist in budget flexibility, location, or risk tolerance.",
      };
    }
    return {
      badgeVariant: "danger" as const,
      badgeText: "High Divergence (Intervention Required)",
      color: "#f43f5e", // Rose
      textColor: "text-rose-400",
      bgLight: "bg-rose-500/10",
      icon: Flame,
      description: "Substantial gap between student passion vectors and parental constraints.",
    };
  };

  const config = getLabelConfig();
  const Icon = config.icon;

  // Semicircle gauge calculation:
  const radius = 70;
  const strokeWidth = 14;
  const arcLength = Math.PI * radius; // ~219.9
  const clampedIndex = Math.min(Math.max(index, 0), 100);
  const strokeDashoffset = arcLength - (arcLength * clampedIndex) / 100;

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl relative overflow-hidden">
      {/* Background glow tailored to conflict */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 -mr-20 -mt-20"
        style={{ backgroundColor: config.color }}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Icon className={`h-4 w-4 ${config.textColor}`} />
            </span>
            <CardTitle className="text-lg">Parent-Student Conflict Index</CardTitle>
          </div>
          <Badge variant={config.badgeVariant}>{config.badgeText}</Badge>
        </div>
        <CardDescription className="text-xs">
          Quantifies preference variance across risk appetite, geographic flexibility, and financial limits.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* SVG Semicircle Gauge */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative w-48 h-28 flex items-center justify-center">
            <svg
              className="w-48 h-28 overflow-visible"
              viewBox="0 0 160 90"
            >
              {/* Background Arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Dynamic Filled Arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke={config.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Numeric Display inside Arc */}
            <div className="absolute bottom-1 flex flex-col items-center text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight font-[Outfit,sans-serif]">
                {index}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </span>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${config.textColor}`}>
                {label} Friction
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 max-w-xs mt-1">
            {config.description}
          </p>
        </div>

        {/* Top Disagreements */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Primary Divergence Drivers</span>
            <span className="text-slate-400">Gap Magnitude</span>
          </div>

          <div className="space-y-2.5">
            {topDisagreements && topDisagreements.length > 0 ? (
              topDisagreements.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 capitalize">
                      {item.dimension}
                    </span>
                    <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Δ {item.gap}%
                    </span>
                  </div>

                  {item.text && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {item.text}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/[0.04]">
                    <div className="flex flex-col bg-violet-950/30 p-2 rounded border border-violet-500/20 space-y-0.5">
                      <span className="text-[10px] text-violet-300 uppercase tracking-wide">Student Side:</span>
                      <span className="font-semibold text-white truncate">{item.studentValue}</span>
                    </div>
                    <div className="flex flex-col bg-cyan-950/30 p-2 rounded border border-cyan-500/20 space-y-0.5">
                      <span className="text-[10px] text-cyan-300 uppercase tracking-wide">Parent Side:</span>
                      <span className="font-semibold text-white truncate">{item.parentValue}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No significant divergence points detected.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
