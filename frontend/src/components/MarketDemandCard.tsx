"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInr } from "@/components/FinanceBreakdownCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MarketData } from "@/types/api";
import type { components } from "@/types/openapi";

interface MarketDemandCardProps {
  marketDataList: MarketData[];
}

type Row = { region: string; demand: number; growth: string; entry: number | null; median: number | null; estimated: boolean };

const growthText = (rate: number | null | undefined) => (rate == null ? "—" : `${rate > 0 ? "+" : ""}${rate}%`);

/** Demand, growth and pay for one career at a time, with the source and date. */
export function MarketDemandCard({ marketDataList }: MarketDemandCardProps) {
  const [careerId, setCareerId] = React.useState(marketDataList[0]?.careerId ?? "");
  const [full, setFull] = React.useState<components["schemas"]["CareerMarket"] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const current = marketDataList.find((m) => m.careerId === careerId) ?? marketDataList[0];

  // The full breakdown (every region with data) for the selected career.
  React.useEffect(() => {
    if (!careerId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const market = await api.getMarket(careerId);
        if (!cancelled) setFull(market);
      } catch {
        if (!cancelled) setFull(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [careerId]);

  if (!current) return null;

  const fromApi = full && full.career_id === careerId ? (full.regions.length ? full.regions : full.national ? [full.national] : []) : [];
  const rows: Row[] = fromApi.length
    ? fromApi.map((r) => ({
        region: r.region,
        demand: Math.round(r.demand_index * 100),
        growth: growthText(r.growth_rate),
        entry: r.entry_salary,
        median: r.median_salary,
        estimated: r.data_quality === "estimated",
      }))
    : [
        {
          region: current.region,
          demand: current.demandIndex,
          growth: current.growth,
          entry: current.entrySalary,
          median: current.medianSalary,
          estimated: current.dataQuality === "estimated",
        },
      ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {marketDataList.map((m) => (
          <button
            key={m.careerId}
            type="button"
            onClick={() => setCareerId(m.careerId)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              m.careerId === careerId ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {m.careerName}
          </button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />}
      </div>

      {rows.map((row) => (
        <div key={row.region} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{row.region === "India" ? "All of India" : row.region}</h3>
            {row.estimated && <Badge variant="warning">Estimate</Badge>}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Hiring demand</span>
              <span>{row.demand}/100</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(row.demand, 100)}%` }} />
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Starting pay</dt>
              <dd className="font-medium">{formatInr(row.entry)}/yr</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Typical pay</dt>
              <dd className="font-medium">{formatInr(row.median)}/yr</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hiring growth</dt>
              <dd className="font-medium">{row.growth}</dd>
            </div>
          </dl>
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        Source: {current.source} · As of {current.asOf}
      </p>
    </div>
  );
}
