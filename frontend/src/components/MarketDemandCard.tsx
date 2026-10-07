"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Database, Calendar } from "lucide-react";
import type { MarketData } from "@/types/api";

interface MarketDemandCardProps {
  marketDataList: MarketData[];
}

export function MarketDemandCard({ marketDataList }: MarketDemandCardProps) {
  const [selectedCareerId, setSelectedCareerId] = React.useState<string>(
    marketDataList[0]?.careerId ?? ""
  );

  const currentData =
    marketDataList.find((m) => m.careerId === selectedCareerId) || marketDataList[0];

  const formatInr = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  if (!currentData) return null;

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">Geographic Hiring & Salary Velocity</CardTitle>
          </div>
          <Badge variant="cyan">Epic D2 Live Signals</Badge>
        </div>
        <CardDescription className="text-xs">
          Empirical hiring velocity, median entry salary, and sector expansion across Indian tech & innovation hubs.
        </CardDescription>

        {/* Career selector chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {marketDataList.map((m) => {
            const isSelected = m.careerId === currentData.careerId;
            return (
              <button
                key={m.careerId}
                onClick={() => setSelectedCareerId(m.careerId)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow-sm"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {m.careerName}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Regional Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentData.regions.map((region) => (
            <div
              key={region.region}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {region.region}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {region.growth}
                </span>
              </div>

              {/* Demand bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Hiring Demand</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {region.demandIndex}/100
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${region.demandIndex}%` }}
                  />
                </div>
              </div>

              {/* Salary representation */}
              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Median Salary:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatInr(region.medianSalary)}
                  <span className="text-[10px] text-slate-400 font-normal">/yr</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Source and Provenance verification footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            Source: <strong className="text-slate-300">{currentData.source}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Benchmark Date: <strong className="text-slate-300">{currentData.asOf}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
