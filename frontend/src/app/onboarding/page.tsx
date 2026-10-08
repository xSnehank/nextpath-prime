"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, RiskPicker, StateSelect, YesNo, fieldErrorMap } from "@/components/ChoiceFields";
import { Notice, PageShell, selectClass } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, GENDERS, HINTS, STREAMS } from "@/lib/constants";
import type { IndianState, SchoolStream, StudentProfile } from "@/types/api";

type Category = (typeof CATEGORIES)[number]["value"];
type Gender = (typeof GENDERS)[number]["value"];

/** The student's choices (PUT /profile), asked once after sign-up and before the assessment. */
export default function OnboardingPage() {
  const router = useRouter();
  const [stream, setStream] = React.useState<SchoolStream | "">("");
  const [homeState, setHomeState] = React.useState<IndianState | "">("");
  const [preferredState, setPreferredState] = React.useState<IndianState | "">("");
  const [risk, setRisk] = React.useState<number | null>(null);
  const [abroad, setAbroad] = React.useState<boolean | null>(null);
  const [category, setCategory] = React.useState<Category | "">("");
  const [percentage, setPercentage] = React.useState("");
  const [gender, setGender] = React.useState<Gender | "">("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Only students who haven't saved their choices belong here.
  React.useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((me) => {
        if (!active) return;
        if (me.role !== "student") router.replace("/dashboard");
        else if (me.progress.profile_complete)
          router.replace(me.progress.assessment_complete ? "/dashboard" : "/assessment/student");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  const ready = Boolean(stream && homeState && preferredState && risk !== null && abroad !== null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return setError("Please answer the five questions above the optional section.");
    setSaving(true);
    setError("");
    setFieldErrors({});
    const profile: StudentProfile = {
      role: "student",
      stream: stream as SchoolStream,
      home_state: homeState as IndianState,
      preferred_state: preferredState as IndianState,
      risk_appetite: risk as number,
      open_to_abroad: Boolean(abroad),
    };
    if (category) profile.category = category;
    if (gender) profile.gender = gender;
    const pct = parseFloat(percentage);
    if (percentage.trim() && !Number.isNaN(pct)) profile.percentage = pct;

    try {
      await api.updateProfile(profile);
      router.push("/assessment/student");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(fieldErrorMap(err.details));
      } else {
        setError("Couldn't save your choices. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="A few quick choices" subtitle="Hover over a label to see what it's used for." width="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Notice>{error}</Notice>}

        <Field id="stream" label="Your Class 11–12 stream" hint={HINTS.stream} error={fieldErrors.stream}>
          <select id="stream" value={stream} onChange={(e) => setStream(e.target.value as SchoolStream | "")} className={selectClass}>
            <option value="">Select your stream</option>
            {STREAMS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="home_state" label="Home state" hint={HINTS.homeState} error={fieldErrors.home_state}>
            <StateSelect id="home_state" value={homeState} onChange={setHomeState} />
          </Field>
          <Field id="preferred_state" label="Where you'd like to study" hint={HINTS.preferredState} error={fieldErrors.preferred_state}>
            <StateSelect id="preferred_state" value={preferredState} onChange={setPreferredState} />
          </Field>
        </div>
        <Field label="Comfort with risk" hint={HINTS.studentRisk} error={fieldErrors.risk_appetite}>
          <RiskPicker value={risk} onChange={setRisk} />
        </Field>
        <Field label="Open to studying abroad?" hint={HINTS.studentAbroad} error={fieldErrors.open_to_abroad}>
          <YesNo value={abroad} onChange={setAbroad} label="Open to studying abroad" />
        </Field>

        <details className="rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Optional (for scholarships)</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field id="category" label="Category" hint={HINTS.category} error={fieldErrors.category}>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category | "")} className={selectClass}>
                <option value="">Prefer not to say</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="percentage" label="Board %" hint={HINTS.percentage} error={fieldErrors.percentage}>
              <Input
                id="percentage"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="e.g. 88"
              />
            </Field>
            <Field id="gender" label="Gender" hint={HINTS.gender} error={fieldErrors.gender}>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className={selectClass}>
                <option value="">Prefer not to say</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </details>

        <Button type="submit" className="w-full" disabled={saving || !ready}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to the assessment <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </PageShell>
  );
}
