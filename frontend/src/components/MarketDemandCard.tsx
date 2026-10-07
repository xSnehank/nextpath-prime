"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Database, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { MarketData } from "@/types/api";
import type { components } from "@/types/openapi";

interface MarketDemandCardProps {
  marketDataList: MarketData[];
}

export function MarketDemandCard({ marketDataList }: MarketDemandCardProps) {
  const [selectedCareerId, setSelectedCareerId] = React.useState<string>(
    marketDataList[0]?.careerId ?? ""
  );
  const [multiRegionData, setMultiRegionData] = React.useState<
    components["schemas"]["CareerMarket"] | null
  >(null);
  const [loadingMarket, setLoadingMarket] = React.useState(false);

  const currentData =
    marketDataList.find((m) => m.careerId === selectedCareerId) || marketDataList[0];

  // Fetch full regional breakdown via GET /careers/{career_id}/market
  React.useEffect(() => {
    if (!selectedCareerId) return;
    let cancelled = false;

    async function loadRegionalData() {
      setLoadingMarket(true);
      try {
        const fullMarket = await api.getMarket(selectedCareerId);
        if (!cancelled) {
          setMultiRegionData(fullMarket);
        }
      } catch (err) {
        console.warn("Could not load multi-region market details:", err);
        if (!cancelled) setMultiRegionData(null);
      } finally {
        if (!cancelled) setLoadingMarket(false);
      }
    }

    loadRegionalData();

    return () => {
      cancelled = true;
    };
  }, [selectedCareerId]);

  const formatInr = (amount: number | null | undefined) => {
    if (!amount) return "—";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  if (!currentData) return null;

  // Render regional cards from multiRegionData.regions if loaded, otherwise currentData
  const displayRegions =
    multiRegionData && multiRegionData.regions.length > 0
      ? multiRegionData.regions.map((r) => ({
          region: r.region,
          demandIndex: Math.round(r.demand_index * 100),
          growth: r.growth_rate != null ? `${r.growth_rate > 0 ? "+" : ""}${r.growth_rate}%` : "—",
          medianSalary: r.median_salary,
          entrySalary: r.entry_salary,
          quality: r.data_quality,
        }))
      : currentData.regions?.map((r) => ({
          region: r.region,
          demandIndex: r.demandIndex,
          growth: r.growth,
          medianSalary: r.medianSalary,
          entrySalary: currentData.entrySalary,
          quality: currentData.dataQuality,
        })) || [
          {
            region: currentData.region,
            demandIndex: currentData.demandIndex,
            growth: currentData.growth,
            medianSalary: currentData.medianSalary,
            entrySalary: currentData.entrySalary,
            quality: currentData.dataQuality,
          },
        ];

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">Geographic Hiring &amp; Salary Velocity</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {loadingMarket && <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
            <Badge variant="cyan">Multi-Region Signals</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Empirical hiring velocity, median entry salary, and sector expansion across Indian innovation hubs.
        </CardDescription>

        {/* Career selector chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {marketDataList.map((m) => {
            const isSelected = m.careerId === selectedCareerId;
            return (
              <button
                key={m.careerId}
                type="button"
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
          {displayRegions.map((region) => (
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
                    style={{ width: `${Math.min(region.demandIndex, 100)}%` }}
                  />
                </div>
              </div>

              {/* Salary Figures */}
              <div className="pt-2 border-t border-white/5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fresher CTC:</span>
                  <span className="font-mono text-white font-medium">
                    {formatInr(region.entrySalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Median CTC:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatInr(region.medianSalary)}
                  </span>
                </div>
              </div>

              {region.quality && (
                <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-500">
                  <ShieldCheck className="h-2.5 w-2.5 text-slate-400" />
                  <span className="capitalize">{region.quality} index</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Source citation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              Source: <strong className="text-slate-300">{currentData.source}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              As of {currentData.asOf}
            </span>
            <span className="capitalize">Quality: {currentData.dataQuality}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
