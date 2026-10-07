"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Compass, Target } from "lucide-react";
import type { SwotAnalysis } from "@/types/api";

interface SwotMatrixProps {
  swot?: SwotAnalysis;
}

export function SwotMatrix({ swot }: SwotMatrixProps) {
  if (!swot) return null;

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Target className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">Student Strategic SWOT Matrix</CardTitle>
          </div>
          <Badge variant="cyan">Epic C3 Analytics</Badge>
        </div>
        <CardDescription className="text-xs">
          Directly derived from normalized psychometric assessments and family constraint vectors.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Strengths */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Strengths (Internal Advantages)</span>
            </div>
            <Badge variant="success" className="text-[10px]">
              {swot.strengths.length} Factors
            </Badge>
          </div>
          <ul className="space-y-2">
            {swot.strengths.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/5"
              >
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <div className="space-y-0.5">
                  <p>{item.text}</p>
                  {item.relatedDomain && (
                    <span className="text-[10px] text-emerald-300 font-mono">
                      Domain: {item.relatedDomain} {item.score ? `(${item.score} pts)` : ""}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Weaknesses (Growth Areas)</span>
            </div>
            <Badge variant="warning" className="text-[10px]">
              {swot.weaknesses.length} Factors
            </Badge>
          </div>
          <ul className="space-y-2">
            {swot.weaknesses.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/5"
              >
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <div className="space-y-0.5">
                  <p>{item.text}</p>
                  {item.relatedDomain && (
                    <span className="text-[10px] text-amber-300 font-mono">
                      Domain: {item.relatedDomain} {item.score ? `(${item.score} pts)` : ""}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <Compass className="h-4 w-4" />
              <span>Opportunities (External Tailwinds)</span>
            </div>
            <Badge variant="cyan" className="text-[10px]">
              {swot.opportunities.length} Tailwinds
            </Badge>
          </div>
          <ul className="space-y-2">
            {swot.opportunities.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/5"
              >
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <div className="space-y-0.5">
                  <p>{item.text}</p>
                  {item.relatedDomain && (
                    <span className="text-[10px] text-cyan-300 font-mono">
                      Target Sector: {item.relatedDomain}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Threats */}
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Threats & External Hurdles</span>
            </div>
            <Badge variant="danger" className="text-[10px]">
              {swot.threats.length} Risks
            </Badge>
          </div>
          <ul className="space-y-2">
            {swot.threats.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/5"
              >
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <div className="space-y-0.5">
                  <p>{item.text}</p>
                  {item.relatedDomain && (
                    <span className="text-[10px] text-rose-300 font-mono">
                      Contingency: {item.relatedDomain}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
