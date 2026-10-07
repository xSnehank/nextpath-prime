"use client";

import * as React from "react";
import { AlertCircle, Compass, ShieldAlert, ShieldCheck } from "lucide-react";
import type { SwotAnalysis } from "@/types/api";

interface SwotMatrixProps {
  swot?: SwotAnalysis;
}

const QUADRANTS = [
  { key: "strengths", title: "Strengths", Icon: ShieldCheck, tone: "text-success" },
  { key: "weaknesses", title: "To work on", Icon: AlertCircle, tone: "text-warning" },
  { key: "opportunities", title: "Opportunities", Icon: Compass, tone: "text-accent" },
  { key: "threats", title: "Risks", Icon: ShieldAlert, tone: "text-danger" },
] as const;

/** Strengths, weaknesses, opportunities and threats, each item from a real score (backend guide, step 7). */
export function SwotMatrix({ swot }: SwotMatrixProps) {
  if (!swot) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUADRANTS.map(({ key, title, Icon, tone }) => {
        const items = swot[key] ?? [];
        return (
          <div key={key} className="rounded-2xl border border-border bg-card p-5">
            <h3 className={`flex items-center gap-2 font-semibold ${tone}`}>
              <Icon className="h-4 w-4" /> {title}
            </h3>
            {items.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nothing stands out here.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
