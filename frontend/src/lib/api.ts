/**
 * API client layer with Backend OpenAPI Adapter.
 *
 * Implements Snehank's OpenAPI contract (backend/openapi/openapi.json):
 * - Injects "Authorization: Bearer <token>" on every request
 * - Drops userId from request bodies (backend gets user from token)
 * - Adapts snake_case and nested roadmap objects (finance, market, path, scholarships)
 *   into clean component types so UI components don't need changes.
 * - Adds endpoints: POST /auth/invite, POST /auth/link, GET /me, GET/PUT /profile, GET /domains.
 */

import type {
  Question,
  AnalyzeResponse,
  MarketData,
  FinancePath,
  CareerPath,
  DomainScore,
  ExplainResponse,
} from "@/types/api";
import type { BackendAnalyzeResponse, BackendCareerItem } from "@/types/backend";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...extra,
  });

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("prism_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: getHeaders(options?.headers),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// =========================================================================
// ADAPTER: Converts Backend Contract (snake_case + nested) -> Frontend Types
// =========================================================================

export function adaptBackendAnalyzeResponse(
  raw: BackendAnalyzeResponse
): AnalyzeResponse {
  const financeList: FinancePath[] = [];
  const marketList: MarketData[] = [];

  const roadmap: CareerPath[] = raw.roadmap.map((item: BackendCareerItem) => {
    // Extract nested finance
    if (item.finance) {
      financeList.push({
        careerId: item.id,
        careerName: item.title,
        totalCost4Year: item.finance.total_cost_4_year,
        familyShare: item.finance.family_share,
        loanNeeded: item.finance.loan_needed,
        expectedStartingSalary: item.finance.expected_starting_salary,
        breakEvenYears: item.finance.break_even_years,
        isViable: item.finance.is_viable,
        failReason: item.finance.fail_reason,
        cheaperAlternative: item.finance.cheaper_alternative,
      });
    }

    // Extract nested market
    if (item.market) {
      marketList.push({
        careerId: item.id,
        careerName: item.title,
        regions: item.market.regions.map((r) => ({
          region: r.region,
          demandIndex: r.demand_index,
          medianSalary: r.median_salary,
          growth: r.growth_rate,
        })),
        source: item.market.source,
        asOf: item.market.as_of,
      });
    }

    return {
      id: item.id,
      rank: item.rank,
      domain: item.domain,
      title: item.title,
      finalScore: item.final_score > 1 ? item.final_score : Math.round(item.final_score * 100),
      compositeScore: item.composite_score > 1 ? item.composite_score : Math.round(item.composite_score * 100),
      financialViability: item.financial_viability > 1 ? item.financial_viability : Math.round(item.financial_viability * 100),
      marketDemand: item.market_demand > 1 ? item.market_demand : Math.round(item.market_demand * 100),
      exams: item.path?.exams?.map((e) => ({
        name: e.name,
        date: e.date,
        registrationDeadline: e.registration_deadline,
      })) || [],
      colleges: item.path?.colleges || [],
      scholarships: item.scholarships || [],
      timeline: item.timeline,
      explanation: item.explanation,
    };
  });

  const domainScores: DomainScore[] = (raw.domain_scores || []).map((ds) => ({
    domain: ds.domain,
    aptitude: ds.aptitude ?? Math.round(ds.composite * 0.95),
    interest: ds.interest ?? Math.round(ds.composite * 1.05),
    cognitiveFit: ds.cognitive_fit ?? Math.round(ds.composite),
    composite: ds.composite > 1 ? ds.composite : Math.round(ds.composite * 100),
  }));

  return {
    studentId: raw.student_id,
    parentId: raw.parent_id,
    domainScores,
    conflict: {
      index: raw.conflict?.index ?? 0,
      label: raw.conflict?.label ?? "low",
      topDisagreements: (raw.conflict?.top_disagreements || []).map((td) => ({
        area: td.area,
        studentValue: td.student_value,
        parentValue: td.parent_value,
        gap: td.gap,
      })),
    },
    finance: financeList,
    market: marketList,
    roadmap,
    swot: raw.swot
      ? {
          strengths: raw.swot.strengths.map((s) => ({
            text: s.text,
            relatedDomain: s.related_domain,
            score: s.score,
          })),
          weaknesses: raw.swot.weaknesses.map((w) => ({
            text: w.text,
            relatedDomain: w.related_domain,
            score: w.score,
          })),
          opportunities: raw.swot.opportunities.map((o) => ({
            text: o.text,
            relatedDomain: o.related_domain,
          })),
          threats: raw.swot.threats.map((t) => ({
            text: t.text,
            relatedDomain: t.related_domain,
          })),
        }
      : undefined,
    generatedAt: raw.generated_at,
  };
}

// =========================================================================
// API CLIENT METHODS
// =========================================================================

export const api = {
  /** Fetch assessment questions. */
  getQuestions: (audience: "student" | "parent") =>
    fetcher<Question[]>(`/questions?audience=${audience}`),

  /** Submit assessment responses (no userId in body; backend uses JWT). */
  postResponses: (answers: Record<string, number | string>) =>
    fetcher<{ ok: boolean }>("/responses", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  /** Generate student invite code (POST /auth/invite). */
  createInvite: () =>
    fetcher<{ invite_code: string }>("/auth/invite", {
      method: "POST",
    }),

  /** Link parent account to student via invite code (POST /auth/link). */
  linkParent: (inviteCode: string) =>
    fetcher<{ ok: boolean }>("/auth/link", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    }),

  /** Current user identity (GET /me). */
  getMe: () => fetcher<{ id: string; email: string; role: string }>("/me"),

  /** Get user profile parameters (GET /profile). */
  getProfile: () => fetcher<Record<string, unknown>>("/profile"),

  /** Update profile parameters (PUT /profile) - parent budget, risk, etc. */
  updateProfile: (profile: Record<string, unknown>) =>
    fetcher<{ ok: boolean }>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  /** Get domain list for top-3 picker (GET /domains). */
  getDomains: () => fetcher<string[]>("/domains"),

  /**
   * Full analysis (POST /analyze) with optional sensitivity weights.
   * Runs through adapter so frontend components receive standardized shapes.
   */
  analyze: async (weights?: { alpha: number; beta: number; gamma: number }): Promise<AnalyzeResponse> => {
    const raw = await fetcher<BackendAnalyzeResponse>("/analyze", {
      method: "POST",
      body: weights ? JSON.stringify({ weights }) : JSON.stringify({}),
    });
    return adaptBackendAnalyzeResponse(raw);
  },

  /** Market data for a single career. */
  getMarket: (careerId: string) =>
    fetcher<MarketData>(`/careers/${careerId}/market`),

  /** LLM explanation for one career recommendation. */
  explain: (careerId: string) =>
    fetcher<ExplainResponse>("/explain", {
      method: "POST",
      body: JSON.stringify({ career_id: careerId }),
    }),

  /** Fetch saved results by ID. */
  getResults: async (resultId: string): Promise<AnalyzeResponse> => {
    const raw = await fetcher<BackendAnalyzeResponse>(`/results/${resultId}`);
    return adaptBackendAnalyzeResponse(raw);
  },
} as const;
