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
import type { Trait, DomainScore } from "@/types/api";

interface RadarTraitsChartProps {
  traits?: Trait[];
  scores?: DomainScore[];
}

export function RadarTraitsChart({ traits = [], scores = [] }: RadarTraitsChartProps) {
  // Mode toggle between 13-trait Psychometric Profile and Domain Vectors
  const [viewMode, setViewMode] = React.useState<"traits" | "domains">(
    traits.length > 0 ? "traits" : "domains"
  );

  // Capitalize dimension label
  const formatDimension = (dim: string) => {
    return dim.charAt(0).toUpperCase() + dim.slice(1);
  };

  // Format data for Recharts Radar
  const traitsChartData = traits.map((t) => ({
    name: formatDimension(t.dimension),
    group: t.group,
    Score: t.value !== null ? Math.round(t.value * 100) : 0,
    hasValue: t.value !== null,
  }));

  const domainsChartData = scores.map((s) => ({
    name: s.domain.split(" / ")[0],
    fullDomain: s.domain,
    Fit: s.fit,
    Aptitude: s.aptitude,
    Interest: s.interest,
    Cognitive: s.cognitive,
  }));

  const chartData = (
    viewMode === "traits" ? traitsChartData : domainsChartData
  ) as unknown as Record<string, unknown>[];

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Student Multi-Vector Psychometric Profile</CardTitle>
            <CardDescription className="text-xs">
              {viewMode === "traits"
                ? "13 intrinsic psychometric dimensions mapped across aptitude, interest, and cognitive styles (0–100 scale)."
                : "Domain alignment vectors derived deterministically from psychometric responses."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {traits.length > 0 && scores.length > 0 && (
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("traits")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === "traits"
                      ? "bg-violet-600 text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  13 Traits
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("domains")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === "domains"
                      ? "bg-violet-600 text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Domains
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
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
                    if (viewMode === "traits") {
                      return (
                        <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-bold text-white text-sm pb-1 border-b border-white/10">
                            {data.name}
                          </p>
                          <p className="text-slate-400 capitalize">
                            Vector Group: <span className="text-white font-semibold">{data.group}</span>
                          </p>
                          <p className="text-violet-300">
                            Score:{" "}
                            <span className="font-bold text-white font-mono">
                              {data.hasValue ? `${data.Score} / 100` : "—"}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
                        <p className="font-bold text-white text-sm pb-1 border-b border-white/10">
                          {data.fullDomain}
                        </p>
                        <p className="text-violet-300">
                          Fit: <span className="font-bold text-white font-mono">{data.Fit} / 100</span>
                        </p>
                        <p className="text-cyan-300">
                          Interest: <span className="font-bold text-white font-mono">{data.Interest} / 100</span>
                        </p>
                        <p className="text-amber-300">
                          Aptitude: <span className="font-bold text-white font-mono">{data.Aptitude} / 100</span>
                        </p>
                        <p className="text-emerald-300">
                          Cognitive: <span className="font-bold text-white font-mono">{data.Cognitive} / 100</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {viewMode === "traits" ? (
                <Radar
                  name="Trait Score"
                  dataKey="Score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
              ) : (
                <>
                  <Radar
                    name="Fit Score"
                    dataKey="Fit"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name="Interest"
                    dataKey="Interest"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                  />
                </>
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Dominant Domains bar chips */}
        {scores.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/5">
            {scores.slice(0, 4).map((domain, i) => (
              <div
                key={domain.domainId || domain.domain}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-center space-y-0.5"
              >
                <div className="text-[10px] text-slate-400 truncate">
                  #{i + 1} {domain.domain.split(" / ")[0]}
                </div>
                <div className="text-xs font-bold font-mono text-white">
                  {domain.fit}/100
                </div>
                <div className="text-[9px] text-emerald-400">
                  Apt: {domain.aptitude} • Int: {domain.interest}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
