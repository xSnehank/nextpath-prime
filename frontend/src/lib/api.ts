/**
 * API client layer — points to mock data for now,
 * swaps to the real FastAPI backend at integration time.
 *
 * Endpoint contract (from OpenAPI spec):
 *   POST /auth/link         – connect parent to student
 *   GET  /questions?audience – fetch question set
 *   POST /responses          – save answers
 *   POST /analyze            – full roadmap (scores, conflict, finance, market)
 *   GET  /careers/{id}/market – demand + salary by region
 *   POST /explain            – LLM explanation for one career
 *   GET  /results/{id}       – fetch saved roadmap
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** When API_BASE is empty we serve from mock data. */
export const IS_MOCK = !API_BASE;

// ---------- generic fetcher ----------

async function fetcher<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  if (IS_MOCK) {
    // Dynamic import from mock layer
    const mocks = await import("@/mocks");
    return mocks.resolve<T>(path, options);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------- typed endpoint helpers ----------

import type {
  Question,
  AnalyzeResponse,
  MarketData,
  ExplainResponse,
} from "@/types/api";

export const api = {
  /** Fetch assessment questions. */
  getQuestions: (audience: "student" | "parent") =>
    fetcher<Question[]>(`/questions?audience=${audience}`),

  /** Submit assessment responses. */
  postResponses: (body: { userId: string; answers: Record<string, number | string> }) =>
    fetcher<{ ok: boolean }>("/responses", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Link parent account to student. */
  linkParent: (body: { studentId: string; parentCode: string }) =>
    fetcher<{ ok: boolean }>("/auth/link", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Full analysis — returns everything the dashboard needs. */
  analyze: (body: { studentId: string; parentId: string }) =>
    fetcher<AnalyzeResponse>("/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Market data for a single career. */
  getMarket: (careerId: string) =>
    fetcher<MarketData>(`/careers/${careerId}/market`),

  /** LLM explanation for one career recommendation. */
  explain: (body: { careerId: string; studentId: string }) =>
    fetcher<ExplainResponse>("/explain", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Fetch saved results. */
  getResults: (resultId: string) =>
    fetcher<AnalyzeResponse>(`/results/${resultId}`),
} as const;
