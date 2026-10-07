"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Scale,
  Sparkles,
  ArrowRight,
  XCircle,
  Loader2,
  Globe2,
  MapPin,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ConsentStep } from "@/components/ConsentStep";
import type { DomainItem, IndianState, ParentProfile } from "@/types/api";

const INDIAN_STATES: IndianState[] = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function ParentAssessmentPage() {
  const router = useRouter();

  // Dynamic domains fetched from GET /domains (Comment 8/14 & 10/14)
  const [availableDomains, setAvailableDomains] = React.useState<DomainItem[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(true);

  // Financial inputs start EMPTY (Comment 10/14: no demo money!)
  const [annualBudget, setAnnualBudget] = React.useState<string>("");
  const [savings, setSavings] = React.useState<string>("");
  const [maxLoan, setMaxLoan] = React.useState<string>("");
  const [annualIncome, setAnnualIncome] = React.useState<string>("");

  // Risk & ROI parameters
  const [riskAppetite, setRiskAppetite] = React.useState<number>(3); // 1-5 scale
  const [breakevenYears, setBreakevenYears] = React.useState<number>(5); // 1-20 scale
  const [preferredState, setPreferredState] = React.useState<IndianState>("Maharashtra");
  const [openToAbroad, setOpenToAbroad] = React.useState<boolean>(false);

  // Exactly 3 ranked domain IDs (UUIDs from GET /domains)
  const [selectedDomainIds, setSelectedDomainIds] = React.useState<string[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [showConsentStep, setShowConsentStep] = React.useState(false);
  const [userConsented, setUserConsented] = React.useState<boolean>(false);
  const [partnerConsented, setPartnerConsented] = React.useState<boolean | undefined>(undefined);

  // Fetch real domains and check parent pairing status
  React.useEffect(() => {
    let active = true;

    async function loadData() {
      setLoadingDomains(true);
      try {
        const [domains, me] = await Promise.all([
          api.getDomains(),
          api.getMe().catch(() => null),
        ]);
        if (active) {
          if (me?.role === "parent") {
            if (!me.pair) {
              router.replace("/parent/join");
              return;
            }
            if (me.progress?.assessment_complete) {
              router.replace("/dashboard");
              return;
            }
            setUserConsented(Boolean(me.consented));
            setPartnerConsented(me.partner?.consented);
          }
          setAvailableDomains(domains);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load career domains:", err);
          setError("Failed to load domains from backend.");
        }
      } finally {
        if (active) setLoadingDomains(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [router]);

  const handleToggleDomain = (domainId: string) => {
    if (selectedDomainIds.includes(domainId)) {
      setSelectedDomainIds(selectedDomainIds.filter((id) => id !== domainId));
      setError("");
    } else {
      if (selectedDomainIds.length >= 3) {
        setError("You must select exactly 3 preferred domains. Deselect one first to replace it.");
        return;
      }
      setError("");
      setSelectedDomainIds([...selectedDomainIds, domainId]);
    }
  };

  const handleMoveDomainRank = (index: number, direction: "up" | "down") => {
    const newDomains = [...selectedDomainIds];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newDomains.length) return;
    const temp = newDomains[index];
    newDomains[index] = newDomains[targetIdx];
    newDomains[targetIdx] = temp;
    setSelectedDomainIds(newDomains);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validate money fields (Item 10: remove commas, require digits only, send parseInt)
    const cleanBudget = annualBudget.replace(/,/g, "").trim();
    const cleanSavings = savings.replace(/,/g, "").trim();
    const cleanMaxLoan = maxLoan.replace(/,/g, "").trim();
    const cleanIncome = annualIncome.replace(/,/g, "").trim();

    if (!cleanBudget || !/^\d+$/.test(cleanBudget)) {
      setError("Please enter a valid Annual Education Budget in whole Rupees (digits only).");
      return;
    }
    if (!cleanSavings || !/^\d+$/.test(cleanSavings)) {
      setError("Please enter valid Education Savings in whole Rupees (digits only).");
      return;
    }
    if (!cleanMaxLoan || !/^\d+$/.test(cleanMaxLoan)) {
      setError("Please enter a valid Maximum Education Loan in whole Rupees (digits only).");
      return;
    }
    if (cleanIncome && !/^\d+$/.test(cleanIncome)) {
      setError("Please enter Gross Annual Income in whole Rupees (digits only).");
      return;
    }

    const parsedBudget = parseInt(cleanBudget, 10);
    const parsedSavings = parseInt(cleanSavings, 10);
    const parsedMaxLoan = parseInt(cleanMaxLoan, 10);
    const parsedIncome = cleanIncome ? parseInt(cleanIncome, 10) : null;

    if (parsedBudget < 0 || parsedSavings < 0 || parsedMaxLoan < 0) {
      setError("Monetary values cannot be negative.");
      return;
    }

    // Require exactly 3 domains
    if (selectedDomainIds.length !== 3) {
      setError(`Please select exactly 3 preferred domains for your child (currently ${selectedDomainIds.length} selected).`);
      return;
    }

    setLoading(true);

    try {
      const profilePayload: ParentProfile = {
        role: "parent",
        annual_education_budget: parsedBudget,
        savings: parsedSavings,
        max_loan: parsedMaxLoan,
        annual_income: parsedIncome,
        risk_appetite: riskAppetite,
        breakeven_tolerance_years: breakevenYears,
        preferred_state: preferredState,
        open_to_abroad: openToAbroad,
        top_domain_ids: selectedDomainIds,
      };

      // 1. Submit PUT /profile (Item 1f: no devUser parameter)
      await api.updateProfile(profilePayload);

      // Transition to explicit Consent Step (Item 2b)
      setShowConsentStep(true);
    } catch (err) {
      console.error("Failed to save parent profile:", err);
      if (err instanceof ApiError) {
        setError(err.message);
        const detailsObj = err.details as { fields?: Array<{ field?: string; issue?: string }> } | undefined;
        if (detailsObj && Array.isArray(detailsObj.fields)) {
          const map: Record<string, string> = {};
          for (const f of detailsObj.fields) {
            if (f.field && f.issue) {
              map[f.field] = f.issue;
            }
          }
          setFieldErrors(map);
        }
      } else {
        setError("Failed to save profile. Please check your inputs and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showConsentStep) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
        <ConsentStep
          role="parent"
          consented={userConsented}
          partnerConsented={partnerConsented}
          onConsentGranted={() => {
            router.push("/dashboard");
          }}
          onSkip={() => {
            router.push("/dashboard");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-4 relative z-10">
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="cyan">Parent Financial &amp; Aspirational Calibration</Badge>
              <span className="text-xs text-slate-400">Collaborative Alignment</span>
            </div>
            <CardTitle className="text-2xl pt-2">Family Constraint &amp; Expectation Calibration</CardTitle>
            <CardDescription className="text-xs text-slate-400 leading-relaxed">
              Your inputs power the Financial Constraint Solver (tuition, debt-tolerance, break-even years)
              and allow NextPath to calculate the Parent-Student Conflict Index. All fields are kept confidential.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: FINANCIAL PARAMETERS (Comment 10/14) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/5 pb-2">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  <span>1. Household Affordability &amp; Education Budget (in ₹ INR)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Annual Budget */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <label className="text-xs font-semibold text-slate-200">
                      Annual Education Budget *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Amount your family can spend each year out of regular income.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 250000"
                      value={annualBudget}
                      onChange={(e) => setAnnualBudget(e.target.value)}
                      required
                      className="font-mono text-emerald-300 text-sm"
                    />
                    {fieldErrors["annual_education_budget"] && (
                      <p className="text-[11px] text-rose-400 font-medium">{fieldErrors["annual_education_budget"]}</p>
                    )}
                  </div>

                  {/* Savings */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <label className="text-xs font-semibold text-slate-200">
                      Education Savings Pool *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Lump-sum savings set aside specifically for higher education.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 600000"
                      value={savings}
                      onChange={(e) => setSavings(e.target.value)}
                      required
                      className="font-mono text-emerald-300 text-sm"
                    />
                    {fieldErrors["savings"] && (
                      <p className="text-[11px] text-rose-400 font-medium">{fieldErrors["savings"]}</p>
                    )}
                  </div>

                  {/* Max Loan */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <label className="text-xs font-semibold text-slate-200">
                      Maximum Education Loan Limit *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Largest total debt your family is willing to take across 4 years.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 800000"
                      value={maxLoan}
                      onChange={(e) => setMaxLoan(e.target.value)}
                      required
                      className="font-mono text-amber-300 text-sm"
                    />
                    {fieldErrors["max_loan"] && (
                      <p className="text-[11px] text-rose-400 font-medium">{fieldErrors["max_loan"]}</p>
                    )}
                  </div>

                  {/* Annual Income (Optional) */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <label className="text-xs font-semibold text-slate-200">
                      Gross Household Annual Income (Optional)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Used strictly for matching income-based merit scholarships.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 1200000 (optional)"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      className="font-mono text-slate-300 text-sm"
                    />
                    {fieldErrors["annual_income"] && (
                      <p className="text-[11px] text-rose-400 font-medium">{fieldErrors["annual_income"]}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: RISK, ROI & LOCATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/5 pb-2">
                  <Scale className="h-4 w-4 text-violet-400" />
                  <span>2. Risk Appetite, Break-Even Horizon &amp; Location</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Risk Appetite */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">
                        Career Risk Appetite (1–5)
                      </span>
                      <span className="font-mono font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded">
                        Level {riskAppetite} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={riskAppetite}
                      onChange={(e) => setRiskAppetite(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>1: Security &amp; PSU/Govt</span>
                      <span>5: High-upside Startups</span>
                    </div>
                  </div>

                  {/* Break-Even Tolerance Years */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">
                        Break-Even Tolerance Window
                      </span>
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                        {breakevenYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={breakevenYears}
                      onChange={(e) => setBreakevenYears(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>1 Year (Fast ROI)</span>
                      <span>15 Years (Long term)</span>
                    </div>
                  </div>

                  {/* Preferred State */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Preferred Study/Work State *</span>
                    </label>
                    <select
                      value={preferredState}
                      onChange={(e) => setPreferredState(e.target.value as IndianState)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Open To Abroad */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Globe2 className="h-3.5 w-3.5 text-violet-400" />
                        <span>Open to Studying Abroad?</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Permits recommendations including global university pathways.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOpenToAbroad(false)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          !openToAbroad
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        India Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenToAbroad(true)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          openToAbroad
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        Open to Abroad
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TOP 3 DOMAINS PICKER (Comment 10/14) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>3. Top 3 Hoped-For Career Domains (Pick exactly 3)</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {selectedDomainIds.length} of 3 selected
                  </span>
                </div>

                {loadingDomains ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    Loading available domains from catalog...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableDomains.map((domain) => {
                      const isSelected = selectedDomainIds.includes(domain.id);
                      const rankIndex = selectedDomainIds.indexOf(domain.id);
                      return (
                        <button
                          key={domain.id}
                          type="button"
                          onClick={() => handleToggleDomain(domain.id)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? "bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-950/40"
                              : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:border-white/15"
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="font-semibold block text-white">
                              {domain.name}
                            </span>
                            {domain.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {domain.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="shrink-0 h-5 px-1.5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                              #{rankIndex + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {fieldErrors["top_domain_ids"] && (
                  <p className="text-[11px] text-rose-400 font-medium">{fieldErrors["top_domain_ids"]}</p>
                )}

                {/* Ranked Order Controller */}
                {selectedDomainIds.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 mt-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Preference Priority (1st Choice to 3rd Choice):
                    </span>
                    <div className="space-y-1.5">
                      {selectedDomainIds.map((domainId, idx) => {
                        const domainObj = availableDomains.find((d) => d.id === domainId);
                        return (
                          <div
                            key={domainId}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-400">
                                Choice #{idx + 1}:
                              </span>
                              <span>{domainObj?.name || domainId}</span>
                            </span>
                            <div className="flex gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveDomainRank(idx, "up")}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px]"
                                >
                                  ▲ Up
                                </button>
                              )}
                              {idx < selectedDomainIds.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveDomainRank(idx, "down")}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px]"
                                >
                                  ▼ Down
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Data used strictly for deterministic solver constraints.
              </span>
              <Button
                type="submit"
                disabled={loading || selectedDomainIds.length !== 3}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Parameters &amp; Consenting...
                  </>
                ) : (
                  <>
                    Save Constraints &amp; Launch Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
