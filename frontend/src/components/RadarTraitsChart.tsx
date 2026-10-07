"use client";

import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { DomainScore } from "@/types/api";

interface RadarTraitsChartProps {
  scores: DomainScore[];
}

export function RadarTraitsChart({ scores }: RadarTraitsChartProps) {
  // Format data for Recharts Radar
  const chartData = scores.map((s) => ({
    domain: s.domain.split(" / ")[0], // Shorter domain label for radar axis
    fullDomain: s.domain,
    Aptitude: s.aptitude,
    Interest: s.interest,
    CognitiveFit: s.cognitiveFit,
    Composite: Math.round(s.composite),
  }));

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Student Multi-Vector Psychometric Profile</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-violet-400 inline-block" />
              Composite Score
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
              Interest
            </span>
          </div>
        </div>
        <CardDescription className="text-xs">
          8 career domain vectors normalized from 30 psychometric indicators (0–100 scale).
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 9 }}
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
                        <p className="font-bold text-white text-sm pb-1 border-b border-white/10">
                          {data.fullDomain}
                        </p>
                        <p className="text-violet-300">
                          Composite: <span className="font-bold text-white">{data.Composite} / 100</span>
                        </p>
                        <p className="text-cyan-300">
                          Interest: <span className="font-bold text-white">{data.Interest} / 100</span>
                        </p>
                        <p className="text-amber-300">
                          Aptitude: <span className="font-bold text-white">{data.Aptitude} / 100</span>
                        </p>
                        <p className="text-emerald-300">
                          Cognitive Fit: <span className="font-bold text-white">{data.CognitiveFit} / 100</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                name="Composite Match"
                dataKey="Composite"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.4}
              />
              <Radar
                name="Interest Factor"
                dataKey="Interest"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Dominant Domains bar chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/5">
          {scores.slice(0, 4).map((domain, i) => (
            <div
              key={domain.domain}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-center space-y-0.5"
            >
              <div className="text-[10px] text-slate-400 truncate">
                #{i + 1} {domain.domain.split(" / ")[0]}
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {Math.round(domain.composite)} pts
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
