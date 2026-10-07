"use client";

import * as React from "react";
import { FieldHint } from "@/components/FieldHint";
import { selectClass } from "@/components/PageShell";
import { INDIAN_STATES, RISK_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { IndianState } from "@/types/api";

/** A labelled field with a hover hint, plus the backend's message for it if it was rejected. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <FieldHint label={label} hint={hint} htmlFor={id} />
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function StateSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: IndianState | "";
  onChange: (value: IndianState | "") => void;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as IndianState | "")} className={selectClass}>
      <option value="" disabled>
        Select a state
      </option>
      {INDIAN_STATES.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
}

function Segmented<T extends string | number | boolean>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground font-medium"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Comfort with risk, 1 (very safe) to 5 (very open). */
export function RiskPicker({ value, onChange }: { value: number | null; onChange: (value: number) => void }) {
  return <Segmented options={RISK_LEVELS} value={value} onChange={onChange} label="Comfort with risk" />;
}

const YES_NO = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
] as const;

export function YesNo({ value, onChange, label }: { value: boolean | null; onChange: (value: boolean) => void; label: string }) {
  return <Segmented options={YES_NO} value={value} onChange={onChange} label={label} />;
}

/** Turns the API's field errors ({fields: [{field, issue}]}) into {field: issue}. */
export function fieldErrorMap(details: unknown): Record<string, string> {
  const fields = (details as { fields?: { field?: string; issue?: string }[] } | undefined)?.fields;
  const map: Record<string, string> = {};
  for (const f of fields ?? []) {
    if (f.field && f.issue) map[f.field] = f.issue;
  }
  return map;
}
