"use client";

import * as React from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import type { DomainScore, Trait } from "@/types/api";

interface RadarTraitsChartProps {
  traits?: Trait[];
  scores?: DomainScore[];
}

type Point = { name: string; score: number; detail: string };

/** The student's 13 trait scores, or their fit with each career area (0-100). Colours follow the theme. */
export function RadarTraitsChart({ traits = [], scores = [] }: RadarTraitsChartProps) {
  const [view, setView] = React.useState<"traits" | "areas">(traits.length ? "traits" : "areas");

  const points: Point[] =
    view === "traits"
      ? traits.map((t) => ({
          name: t.dimension.charAt(0).toUpperCase() + t.dimension.slice(1),
          score: t.value === null ? 0 : Math.round(t.value * 100),
          detail: t.value === null ? "No answers" : `${t.group}`,
        }))
      : scores.map((s) => ({
          name: s.domain.split(" / ")[0],
          score: s.fit,
          detail: `Aptitude ${s.aptitude} · Interest ${s.interest} · Thinking ${s.cognitive}`,
        }));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{view === "traits" ? "Strengths profile" : "Fit with each area"}</h3>
        {traits.length > 0 && scores.length > 0 && (
          <div className="flex rounded-full border border-border p-0.5 text-xs">
            {(["traits", "areas"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn("rounded-full px-2.5 py-1", view === v ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground")}
              >
                {v === "traits" ? "Traits" : "Areas"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={points}>
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">
                      {p.name}: {p.score}/100
                    </p>
                    <p className="text-muted-foreground">{p.detail}</p>
                  </div>
                );
              }}
            />
            <Radar dataKey="score" stroke="var(--accent)" fill="var(--primary)" fillOpacity={0.45} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
