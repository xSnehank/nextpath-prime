/**
 * API client layer with Backend OpenAPI Adapter.
 *
 * Implements the OpenAPI contract (backend/openapi/openapi.json):
 * - Injects "Authorization: Bearer <token>" from Supabase session or localStorage.
 * - Supports "X-Dev-User" for demo/mock backend testing.
 * - Captures structured ApiError (status, code, details, requestId) on non-2xx responses.
 * - Adapts snake_case and nested roadmap objects (finance, market, path, scholarships)
 *   into clean component types without fictional data.
 */

import { getAuthToken } from "@/lib/supabase";
import type { components } from "@/types/openapi";
import type {
  AnalyzeResponse,
  CareerPath,
  CareerMarket,
  ConflictResult,
  ConsentResponse,
  DemoRunResponse,
  DomainItem,
  DomainScore,
  ExplainResponse,
  FinancePath,
  InviteResponse,
  LinkResponse,
  MarketData,
  MeResponse,
  ParentProfile,
  Question,
  StudentProfile,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// =========================================================================
// ERROR CLASS
// =========================================================================

export class ApiError extends Error {
  status: number;
  code?: components["schemas"]["ErrorCode"] | string;
  details?: Record<string, unknown>;
  requestId?: string | null;

  constructor(
    status: number,
    code?: components["schemas"]["ErrorCode"] | string,
    message?: string,
    details?: Record<string, unknown>,
    requestId?: string | null
  ) {
    super(message || `API Error ${status}${code ? `: ${code}` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

// =========================================================================
// REQUEST HEADERS & FETCHER
// =========================================================================

interface FetcherOptions extends RequestInit {
  devUser?: string;
}

async function getHeaders(extra?: HeadersInit, devUserOverride?: string): Promise<Headers> {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...extra,
  });

  if (typeof window !== "undefined") {
    // 1. Bearer Token
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // 2. Mock mode dev user (demo student or parent)
    const devUser = devUserOverride || localStorage.getItem("prism_dev_user");
    if (devUser) {
      headers.set("X-Dev-User", devUser);
    }
  }

  return headers;
}

async function fetcher<T>(path: string, options?: FetcherOptions): Promise<T> {
  const { devUser, ...init } = options || {};
  const headers = await getHeaders(init.headers, devUser);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as components["schemas"]["ErrorBody"] | null;
    const requestId = res.headers.get("X-Request-ID");
    throw new ApiError(
      res.status,
      errorBody?.error?.code,
      errorBody?.error?.message || res.statusText,
      errorBody?.error?.details as Record<string, unknown> | undefined,
      requestId
    );
  }

  return res.json() as Promise<T>;
}

// =========================================================================
// ADAPTER: Converts Backend OpenAPI AnalyzeResponse -> Frontend Component Types
// =========================================================================

function formatFinanceReason(reason: components["schemas"]["FinanceReason"]): string {
  switch (reason) {
    case "LOAN_EXCEEDS_LIMIT":
      return "Required education loan exceeds family debt threshold";
    case "BREAKEVEN_TOO_LONG":
      return "Investment recovery duration exceeds acceptable break-even window";
    case "COST_EXCEEDS_CAPACITY":
      return "Total 4-year tuition & living costs exceed family savings capacity";
    default:
      return reason;
  }
}

export function adaptBackendAnalyzeResponse(
  raw: components["schemas"]["AnalyzeResponse"]
): AnalyzeResponse {
  const financeList: FinancePath[] = [];
  const marketList: MarketData[] = [];

  const roadmap: CareerPath[] = raw.roadmap.map((item) => {
    // 1. Finance mapping
    const finReasons = item.finance.reasons || [];
    const financePath: FinancePath = {
      careerId: item.career_id,
      careerName: item.career,
      totalCost4Year: item.finance.total_cost,
      totalCost: item.finance.total_cost,
      familyShare: item.finance.capacity,
      capacity: item.finance.capacity,
      loanNeeded: item.finance.loan_needed,
      expectedStartingSalary: item.finance.starting_salary,
      startingSalary: item.finance.starting_salary,
      breakEvenYears: item.finance.breakeven_years,
      durationYears: item.finance.duration_years,
      isViable: item.finance.viable,
      viable: item.finance.viable,
      failReason: finReasons.length > 0 ? formatFinanceReason(finReasons[0]) : undefined,
      reasons: finReasons,
      cheaperAlternative: item.cheaper_alternative,
    };
    financeList.push(financePath);

    // 2. Single Region Market mapping (Comment 1/14 fix)
    const demandIndex = Math.round(item.market.demand_index * 100);
    const growthStr =
      item.market.growth_rate != null
        ? `${item.market.growth_rate > 0 ? "+" : ""}${item.market.growth_rate}%`
        : "—";

    const marketData: MarketData = {
      careerId: item.career_id,
      careerName: item.career,
      region: item.market.region,
      demandIndex,
      growthRate: item.market.growth_rate,
      growth: growthStr,
      medianSalary: item.market.median_salary,
      entrySalary: item.market.entry_salary,
      asOf: item.market.as_of,
      source: item.market.source,
      dataQuality: item.market.data_quality,
      // Provide single region item in regions array so legacy components won't throw reading .regions
      regions: [
        {
          region: item.market.region,
          demandIndex,
          medianSalary: item.market.median_salary || 0,
          growth: growthStr,
        },
      ],
    };
    marketList.push(marketData);

    // 3. Exam & Colleges & Scholarships mapping
    const exams = (item.path.exams || []).map((examName) => ({
      name: examName,
    }));

    const colleges = (item.path.colleges || []).map((col) => ({
      name: col.name,
      location: "India",
      annualFee: col.annual_fee,
    }));

    const scholarships = (item.scholarships || []).map((sch) => ({
      name: sch.name,
      amount: `Rs. ${sch.amount.toLocaleString("en-IN")}`,
      eligibility: sch.matched_rule,
      deadline: sch.deadline || "TBA",
      matchedRule: sch.matched_rule,
    }));

    // 4. Scores mapping (Comment 1/14 fix: final_100, fit/finance/market * 100)
    const finalScore = item.scores.final_100 ?? Math.round(item.scores.final * 100);
    const compositeScore = Math.round(item.scores.fit * 100);
    const financialViability = Math.round(item.scores.finance * 100);
    const marketDemand = Math.round(item.scores.market * 100);

    return {
      id: item.career_id,
      rank: item.rank,
      domain: item.domain,
      career: item.career,
      title: item.career,
      finalScore,
      compositeScore,
      financialViability,
      marketDemand,
      financeViable: item.finance.viable,
      rawScores: {
        fit: item.scores.fit,
        finance: item.scores.finance,
        market: item.scores.market,
        final: item.scores.final,
        final100: finalScore,
      },
      finance: financePath,
      market: marketData,
      exams,
      rawExams: item.path.exams || [],
      colleges,
      scholarships,
      timeline: item.path.education,
      cheaperAlternative: item.cheaper_alternative,
    };
  });

  // 5. Domain scores mapping 1-to-1 (Comment 12/14 fix: no made-up math)
  const domainScores: DomainScore[] = (raw.domain_scores || []).map((ds) => {
    const fit = Math.round(ds.fit * 100);
    const aptitude = Math.round(ds.aptitude * 100);
    const interest = Math.round(ds.interest * 100);
    const cognitive = Math.round(ds.cognitive * 100);
    return {
      domainId: ds.domain_id,
      domain: ds.domain,
      fit,
      aptitude,
      interest,
      cognitive,
      cognitiveFit: cognitive,
      composite: fit,
      raw: {
        fit: ds.fit,
        aptitude: ds.aptitude,
        interest: ds.interest,
        cognitive: ds.cognitive,
      },
    };
  });

  // 6. Conflict result mapping (Comment 1/14 & 8/14 fix: top_gaps)
  const conflict: ConflictResult = {
    index: raw.conflict.index,
    label: raw.conflict.label,
    topDisagreements: (raw.conflict.top_gaps || []).map((g) => ({
      area: g.dimension.toUpperCase(),
      dimension: g.dimension,
      gap: Math.round(g.gap * 100),
      text: g.text,
      studentValue: g.student_value || "—",
      parentValue: g.parent_value || "—",
    })),
    gaps: (raw.conflict.gaps || []).map((g) => ({
      area: g.dimension.toUpperCase(),
      dimension: g.dimension,
      gap: Math.round(g.gap * 100),
      text: g.text,
      studentValue: g.student_value || "—",
      parentValue: g.parent_value || "—",
    })),
  };

  // 7. SWOT mapping
  const swot = raw.swot
    ? {
        strengths: raw.swot.strengths.map((s) => ({
          text: s.text,
          value: s.value,
          score: Math.round(s.value * 100),
        })),
        weaknesses: raw.swot.weaknesses.map((w) => ({
          text: w.text,
          value: w.value,
          score: Math.round(w.value * 100),
        })),
        opportunities: raw.swot.opportunities.map((o) => ({
          text: o.text,
          value: o.value,
        })),
        threats: raw.swot.threats.map((t) => ({
          text: t.text,
          value: t.value,
        })),
      }
    : undefined;

  return {
    resultId: raw.result_id,
    weights: raw.weights,
    conflict,
    traits: raw.traits || [],
    domainScores,
    finance: financeList,
    market: marketList,
    roadmap,
    rejected: (raw.rejected || []).map((r) => ({
      careerId: r.career_id,
      career: r.career,
      reasons: r.reasons,
      cheaperAlternative: r.cheaper_alternative,
    })),
    swot,
    createdAt: raw.created_at,
    generatedAt: raw.created_at,
  };
}

// =========================================================================
// API CLIENT METHODS
// =========================================================================

export const api = {
  /** Check backend health status (GET /health). */
  getHealth: () =>
    fetcher<components["schemas"]["HealthResponse"]>("/health"),

  /** Current user identity, linked pair and progress (GET /me). */
  getMe: (devUser?: string) =>
    fetcher<MeResponse>("/me", { devUser }),

  /** Fetch assessment questions for students or parents (GET /questions). */
  getQuestions: async (audience: "student" | "parent"): Promise<Question[]> => {
    const res = await fetcher<components["schemas"]["QuestionSet"]>(
      `/questions?audience=${audience}`
    );
    return res.questions.map((q) => ({
      id: q.id,
      group: q.group,
      dimension: q.dimension,
      text: q.text,
      options: q.options,
      required: q.required,
      audience: res.audience,
      type: "likert",
    }));
  },

  /** Submit assessment responses (POST /responses). */
  postResponses: (answers: { question_id: string; value: number }[]) =>
    fetcher<components["schemas"]["ResponsesSaved"]>("/responses", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  /** Student creates an invite code for their parent (POST /auth/invite). */
  createInvite: () =>
    fetcher<InviteResponse>("/auth/invite", {
      method: "POST",
    }),

  /** Parent redeems invite code to link accounts (POST /auth/link). */
  linkParent: (inviteCode: string, devUser?: string) =>
    fetcher<LinkResponse>("/auth/link", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
      devUser,
    }),

  /** Get user saved profile (GET /profile). */
  getProfile: (devUser?: string) =>
    fetcher<ParentProfile | StudentProfile>("/profile", { devUser }),

  /** Save parent or student profile (PUT /profile). */
  updateProfile: (profile: ParentProfile | StudentProfile, devUser?: string) =>
    fetcher<ParentProfile | StudentProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
      devUser,
    }),

  /** Get career domain list for parent top-3 picker (GET /domains). */
  getDomains: () =>
    fetcher<DomainItem[]>("/domains"),

  /** Agree or stop agreeing to parent-student comparison (POST /consent). */
  postConsent: (agree: boolean = true, devUser?: string) =>
    fetcher<ConsentResponse>("/consent", {
      method: "POST",
      body: JSON.stringify({ agree }),
      devUser,
    }),

  /**
   * Run the whole analysis pipeline (POST /analyze).
   * Weights must sum to 1.0; auto-normalizes if needed.
   */
  analyze: async (req: {
    student_id: string;
    parent_id: string;
    weights?: { fit: number; finance: number; market: number };
  }): Promise<AnalyzeResponse> => {
    let weights = req.weights;
    if (weights) {
      const sum = weights.fit + weights.finance + weights.market;
      if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
        weights = {
          fit: Number((weights.fit / sum).toFixed(4)),
          finance: Number((weights.finance / sum).toFixed(4)),
          market: Number((1.0 - weights.fit / sum - weights.finance / sum).toFixed(4)),
        };
      }
    } else {
      weights = { fit: 0.45, finance: 0.3, market: 0.25 };
    }

    const raw = await fetcher<components["schemas"]["AnalyzeResponse"]>("/analyze", {
      method: "POST",
      body: JSON.stringify({
        student_id: req.student_id,
        parent_id: req.parent_id,
        weights,
      }),
    });
    return adaptBackendAnalyzeResponse(raw);
  },

  /** Fetch saved roadmap result by ID (GET /results/{result_id}). */
  getResults: async (resultId: string): Promise<AnalyzeResponse> => {
    const raw = await fetcher<components["schemas"]["AnalyzeResponse"]>(`/results/${resultId}`);
    return adaptBackendAnalyzeResponse(raw);
  },

  /** Plain-language explanation for one career in a result (POST /explain). */
  explain: async (req: { result_id: string; career_id: string }): Promise<ExplainResponse> => {
    const res = await fetcher<components["schemas"]["ExplainResponse"]>("/explain", {
      method: "POST",
      body: JSON.stringify({
        result_id: req.result_id,
        career_id: req.career_id,
      }),
    });
    return {
      careerId: res.career_id,
      text: res.text,
      source: res.source,
      explanation: res.text,
    };
  },

  /** Demand and salary by region for one career (GET /careers/{career_id}/market). */
  getMarket: (careerId: string): Promise<CareerMarket> =>
    fetcher<CareerMarket>(`/careers/${careerId}/market`),

  /** Load the demo family and return its result id (POST /demo/run). */
  runDemo: () =>
    fetcher<DemoRunResponse>("/demo/run", {
      method: "POST",
    }),
} as const;
