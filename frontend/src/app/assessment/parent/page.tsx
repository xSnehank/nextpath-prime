"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConsentStep } from "@/components/ConsentStep";
import { Field, RiskPicker, StateSelect, YesNo, fieldErrorMap } from "@/components/ChoiceFields";
import { Notice, PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { HINTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DomainItem, IndianState, ParentProfile } from "@/types/api";

/** "2,50,000" or "250000" -> 250000; anything else -> null. Money is whole rupees. */
function rupees(text: string): number | null {
  const clean = text.replace(/,/g, "").trim();
  return /^\d+$/.test(clean) ? parseInt(clean, 10) : null;
}

function MoneyInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
      <Input id={id} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

/** The parent's budget, limits and hopes (PUT /profile), then the consent step. */
export default function ParentAssessmentPage() {
  const router = useRouter();
  const [domains, setDomains] = React.useState<DomainItem[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(true);

  const [budget, setBudget] = React.useState("");
  const [savings, setSavings] = React.useState("");
  const [maxLoan, setMaxLoan] = React.useState("");
  const [income, setIncome] = React.useState("");
  const [risk, setRisk] = React.useState<number | null>(null);
  const [breakeven, setBreakeven] = React.useState("");
  const [preferredState, setPreferredState] = React.useState<IndianState | "">("");
  const [abroad, setAbroad] = React.useState<boolean | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]); // domain ids, first choice first

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [showConsent, setShowConsent] = React.useState(false);
  const [consented, setConsented] = React.useState(false);
  const [partnerConsented, setPartnerConsented] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    Promise.all([api.getDomains(), api.getMe().catch(() => null)])
      .then(([list, me]) => {
        if (!active) return;
        if (me?.role === "parent") {
          if (!me.pair) return router.replace("/parent/join");
          if (me.progress.assessment_complete) return router.replace("/dashboard");
          setConsented(Boolean(me.consented));
          setPartnerConsented(me.partner?.consented);
        }
        setDomains(list);
      })
      .catch(() => active && setError("Couldn't load the career areas. Please refresh."))
      .finally(() => active && setLoadingDomains(false));
    return () => {
      active = false;
    };
  }, [router]);

  const togglePick = (id: string) => {
    setError("");
    if (picked.includes(id)) setPicked(picked.filter((x) => x !== id));
    else if (picked.length < 3) setPicked([...picked, id]);
    else setError("You've picked 3. Remove one to choose another.");
  };
  const move = (index: number, by: -1 | 1) => {
    const next = [...picked];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPicked(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const annual = rupees(budget);
    const saved = rupees(savings);
    const loan = rupees(maxLoan);
    const yearly = income.trim() ? rupees(income) : null;
    const years = parseInt(breakeven, 10);
    if (annual === null || saved === null || loan === null) return setError("Enter the budget, savings and loan in whole rupees.");
    if (income.trim() && yearly === null) return setError("Enter your income in whole rupees, or leave it empty.");
    if (!(years >= 1 && years <= 20)) return setError("Years to recover the cost must be between 1 and 20.");
    if (risk === null || !preferredState || abroad === null) return setError("Please answer every question.");
    if (picked.length !== 3) return setError("Pick exactly 3 career areas.");

    const profile: ParentProfile = {
      role: "parent",
      annual_education_budget: annual,
      savings: saved,
      max_loan: loan,
      annual_income: yearly,
      risk_appetite: risk,
      breakeven_tolerance_years: years,
      preferred_state: preferredState,
      open_to_abroad: abroad,
      top_domain_ids: picked,
    };
    setSaving(true);
    try {
      await api.updateProfile(profile);
      setShowConsent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(fieldErrorMap(err.details));
      } else {
        setError("Couldn't save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (showConsent) {
    return (
      <PageShell title="Saved" subtitle="One last step." width="md">
        <ConsentStep
          role="parent"
          consented={consented}
          partnerConsented={partnerConsented}
          onConsentGranted={() => router.push("/dashboard")}
          onSkip={() => router.push("/dashboard")}
        />
      </PageShell>
    );
  }

  const domainName = (id: string) => domains.find((d) => d.id === id)?.name ?? "";

  return (
    <PageShell title="Your budget and hopes" subtitle="Hover over a label to see how it's used. Only the comparison is shared, never your numbers." width="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Notice>{error}</Notice>}

        <section className="grid gap-5 sm:grid-cols-2">
          <Field id="budget" label="Yearly education budget" hint={HINTS.budget} error={fieldErrors.annual_education_budget}>
            <MoneyInput id="budget" value={budget} onChange={setBudget} placeholder="2,50,000" />
          </Field>
          <Field id="savings" label="Savings for education" hint={HINTS.savings} error={fieldErrors.savings}>
            <MoneyInput id="savings" value={savings} onChange={setSavings} placeholder="6,00,000" />
          </Field>
          <Field id="max_loan" label="Largest loan you'd take" hint={HINTS.maxLoan} error={fieldErrors.max_loan}>
            <MoneyInput id="max_loan" value={maxLoan} onChange={setMaxLoan} placeholder="8,00,000" />
          </Field>
          <Field id="breakeven" label="Years to recover the cost" hint={HINTS.breakeven} error={fieldErrors.breakeven_tolerance_years}>
            <Input id="breakeven" type="number" min={1} max={20} value={breakeven} onChange={(e) => setBreakeven(e.target.value)} placeholder="e.g. 5" />
          </Field>
        </section>

        <section className="space-y-5">
          <Field label="Comfort with risk" hint={HINTS.parentRisk} error={fieldErrors.risk_appetite}>
            <RiskPicker value={risk} onChange={setRisk} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="parent_state" label="Where they should study" hint={HINTS.parentState} error={fieldErrors.preferred_state}>
              <StateSelect id="parent_state" value={preferredState} onChange={setPreferredState} />
            </Field>
            <Field label="Open to studying abroad?" hint={HINTS.parentAbroad} error={fieldErrors.open_to_abroad}>
              <YesNo value={abroad} onChange={setAbroad} label="Open to studying abroad" />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <Field label="Top 3 career areas" hint={HINTS.domains} error={fieldErrors.top_domain_ids}>
            {loadingDomains ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => {
                  const rank = picked.indexOf(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => togglePick(d.id)}
                      aria-pressed={rank >= 0}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        rank >= 0 ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {rank >= 0 && <span className="font-mono text-xs">{rank + 1}</span>}
                      {d.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
          {picked.length > 0 && (
            <ol className="space-y-1.5">
              {picked.map((id, index) => (
                <li key={id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  <span>
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{index + 1}</span>
                    {domainName(id)}
                  </span>
                  <span className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" onClick={() => move(index, 1)} disabled={index === picked.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Remove" onClick={() => togglePick(id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <details className="rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Optional (for scholarships)</summary>
          <div className="mt-4 max-w-sm">
            <Field id="income" label="Yearly family income" hint={HINTS.income} error={fieldErrors.annual_income}>
              <MoneyInput id="income" value={income} onChange={setIncome} placeholder="Leave empty to skip" />
            </Field>
          </div>
        </details>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </form>
    </PageShell>
  );
}
