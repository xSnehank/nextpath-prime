"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const DOMAINS_LIST = [
  "Engineering / Technology",
  "Medicine / Healthcare",
  "Business / Management",
  "Law / Civil Services",
  "Arts / Design / Media",
  "Sciences / Research",
  "Education / Teaching",
  "Defence / Sports",
];

export default function ParentAssessmentPage() {
  const router = useRouter();

  // Financial inputs (Epic B2)
  const [annualBudget, setAnnualBudget] = React.useState<number>(800000);
  const [savings, setSavings] = React.useState<number>(1200000);
  const [maxLoan, setMaxLoan] = React.useState<number>(1500000);
  const [loanComfort, setLoanComfort] = React.useState<number>(3); // 1-5 scale
  const [riskAppetite, setRiskAppetite] = React.useState<number>(2); // 1-5 scale
  const [geographicFlexibility, setGeographicFlexibility] = React.useState<number>(3); // 1-5 scale

  // Hoped-for Domains ranking (Epic B3)
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>([
    "Engineering / Technology",
    "Sciences / Research",
  ]);
  const [notes, setNotes] = React.useState<string>("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleToggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      if (selectedDomains.length >= 3) {
        setError("You can select and rank a maximum of 3 preferred domains.");
        return;
      }
      setError("");
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleMoveDomainRank = (index: number, direction: "up" | "down") => {
    const newDomains = [...selectedDomains];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newDomains.length) return;
    const temp = newDomains[index];
    newDomains[index] = newDomains[targetIdx];
    newDomains[targetIdx] = temp;
    setSelectedDomains(newDomains);
  };

  const formatInr = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lakh`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDomains.length === 0) {
      setError("Please select at least 1 hoped-for career domain for your child.");
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("prism_parent_completed", "true");
      localStorage.setItem("prism_parent_budget", annualBudget.toString());
      localStorage.setItem("prism_parent_savings", savings.toString());
      localStorage.setItem("prism_parent_max_loan", maxLoan.toString());
      localStorage.setItem("prism_parent_loan_comfort", loanComfort.toString());
      localStorage.setItem("prism_parent_risk_appetite", riskAppetite.toString());
      localStorage.setItem("prism_parent_geo_flex", geographicFlexibility.toString());
      localStorage.setItem("prism_parent_ranked_domains", JSON.stringify(selectedDomains));
      localStorage.setItem("prism_parent_notes", notes);

      // Navigate to comprehensive Roadmap Dashboard
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-4 relative z-10">
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="cyan">Epic B2 &amp; B3 • Parent Financial &amp; Aspirational Portal</Badge>
              <span className="text-xs text-slate-400">Collaborative Calibration</span>
            </div>
            <CardTitle className="text-2xl pt-2">Family Constraint &amp; Expectation Vectors</CardTitle>
            <CardDescription className="text-xs text-slate-400 leading-relaxed">
              Your inputs power the Financial Constraint Solver (tuition, debt-tolerance, break-even years)
              and allow PRISM to calculate the Parent-Student Conflict Index.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* SECTION 1: FINANCIAL PARAMETERS (Epic B2) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/5 pb-2">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  <span>1. Household Affordability &amp; Education Budget (in ₹ INR)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Annual Budget */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <label className="text-xs font-semibold text-slate-300">
                      Annual Education Budget
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10000000}
                      step={50000}
                      value={annualBudget}
                      onChange={(e) => setAnnualBudget(Number(e.target.value))}
                      required
                    />
                    <span className="text-[11px] font-mono font-bold text-emerald-400 block pt-0.5">
                      {formatInr(annualBudget)} / year
                    </span>
                  </div>

                  {/* Liquid Savings */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <label className="text-xs font-semibold text-slate-300">
                      Target Savings Earmarked
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={50000000}
                      step={100000}
                      value={savings}
                      onChange={(e) => setSavings(Number(e.target.value))}
                      required
                    />
                    <span className="text-[11px] font-mono font-bold text-cyan-400 block pt-0.5">
                      {formatInr(savings)} saved
                    </span>
                  </div>

                  {/* Maximum Loan Comfort */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <label className="text-xs font-semibold text-slate-300">
                      Max Acceptable Student Loan
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={50000000}
                      step={100000}
                      value={maxLoan}
                      onChange={(e) => setMaxLoan(Number(e.target.value))}
                      required
                    />
                    <span className="text-[11px] font-mono font-bold text-amber-400 block pt-0.5">
                      {formatInr(maxLoan)} loan limit
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: 5-POINT RISK & LOAN SCALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/5 pb-2">
                  <Scale className="h-4 w-4 text-amber-400" />
                  <span>2. Risk Appetite &amp; Mobility Scales (1–5 Standardized Scale)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Loan Comfort */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Loan Comfort</span>
                      <span className="font-mono font-bold text-amber-400">{loanComfort}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={loanComfort}
                      onChange={(e) => setLoanComfort(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      {loanComfort === 1 && "Strongly avoid all debt"}
                      {loanComfort === 2 && "Prefer self-funded"}
                      {loanComfort === 3 && "Neutral / moderate loan"}
                      {loanComfort === 4 && "Comfortable if high ROI"}
                      {loanComfort === 5 && "Aggressively leverage loans"}
                    </span>
                  </div>

                  {/* Risk Appetite */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Non-Traditional Risk</span>
                      <span className="font-mono font-bold text-violet-400">{riskAppetite}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={riskAppetite}
                      onChange={(e) => setRiskAppetite(Number(e.target.value))}
                      className="w-full accent-violet-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      {riskAppetite <= 2
                        ? "Prefer guaranteed, traditional careers"
                        : riskAppetite === 3
                        ? "Open to emerging tech / hybrid paths"
                        : "Supportive of unconventional STEAM/startups"}
                    </span>
                  </div>

                  {/* Geographic Mobility */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Geographic Mobility</span>
                      <span className="font-mono font-bold text-cyan-400">{geographicFlexibility}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={geographicFlexibility}
                      onChange={(e) => setGeographicFlexibility(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      {geographicFlexibility <= 2
                        ? "Prefer home state or city"
                        : geographicFlexibility === 3
                        ? "Pan-India tier 1 cities"
                        : "Full global / overseas flexibility"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: HOPED-FOR DOMAINS RANKER (Epic B3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>3. Rank Up to 3 Preferred Domains for Your Child</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {selectedDomains.length}/3 Selected
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Select up to 3 sectors. Order them by priority to calculate Parent-Student alignment.
                </p>

                {/* Ranked List */}
                {selectedDomains.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/10">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Current Ranking Order:
                    </span>
                    {selectedDomains.map((domain, idx) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center font-mono font-bold text-[10px] border border-violet-500/30">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-white">{domain}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveDomainRank(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDomainRank(idx, "down")}
                            disabled={idx === selectedDomains.length - 1}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDomain(domain)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available domains chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {DOMAINS_LIST.map((domain) => {
                    const isSelected = selectedDomains.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => handleToggleDomain(domain)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-violet-600/20 border-violet-400 text-violet-200 font-semibold"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300">
                  Specific Concerns, Aspirations or Family Considerations (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefer colleges with campus placement guarantees or opportunities near home state."
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Both parties have contributed. The PRISM Engine will now normalize the vectors and generate the unified roadmap.
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-white/5">
              <Button
                type="submit"
                disabled={loading}
                variant="glow"
                className="w-full gap-2 font-semibold shadow-xl shadow-cyan-600/25"
              >
                <span>{loading ? "Generating Roadmap..." : "Synthesize Multi-Vector Roadmap"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
