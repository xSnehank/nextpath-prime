"use client";

import * as React from "react";
import type { ConflictResult } from "@/types/api";

interface ConflictGaugeProps {
  conflict: ConflictResult;
}

const LEVELS = {
  low: { text: "You mostly agree", color: "var(--success)", className: "text-success" },
  moderate: { text: "Some differences", color: "var(--warning)", className: "text-warning" },
  high: { text: "Big differences", color: "var(--danger)", className: "text-danger" },
} as const;

const AREA_NAMES: Record<string, string> = { domain: "Career area", risk: "Risk", location: "Location", budget: "Budget" };

/** How far apart the student and parent are (0 = agree, 100 = fully apart), and the biggest differences. */
export function ConflictGauge({ conflict }: ConflictGaugeProps) {
  const { index, topDisagreements } = conflict;
  const level = index < 30 ? LEVELS.low : index <= 60 ? LEVELS.moderate : LEVELS.high;
  const radius = 70;
  const arc = Math.PI * radius;
  const offset = arc - (arc * Math.min(Math.max(index, 0), 100)) / 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold">How far apart you are</h3>
      <div className="relative mx-auto mt-4 w-48">
        <svg viewBox="0 0 160 90" className="w-full" aria-hidden>
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="var(--chart-grid)" strokeWidth={14} strokeLinecap="round" />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={level.color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={arc}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className="font-display text-3xl font-semibold">{index}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <p className={`mt-2 text-center text-sm font-medium ${level.className}`}>{level.text}</p>

      <ul className="mt-5 space-y-3">
        {topDisagreements?.length ? (
          topDisagreements.map((item) => (
            <li key={item.dimension} className="rounded-xl bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{AREA_NAMES[item.dimension] ?? item.dimension}</span>
                <span className="text-muted-foreground">{item.gap}/100</span>
              </div>
              {item.text && <p className="mt-1 text-muted-foreground">{item.text}</p>}
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">No real differences.</li>
        )}
      </ul>
    </div>
  );
}
