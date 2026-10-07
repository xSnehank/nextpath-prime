/* ============================================
   PRISM Engine — Shared API & Component Types
   Derived strictly from backend/openapi/openapi.json
   ============================================ */

import type { components } from "./openapi";

export type Role = components["schemas"]["Role"];
export type IndianState = components["schemas"]["IndianState"];
export type Dimension = components["schemas"]["Dimension"];
export type TraitGroup = components["schemas"]["TraitGroup"];
export type ErrorCode = components["schemas"]["ErrorCode"];

// ---------- Questions ----------

export interface AnswerOption {
  value: number;
  label: string;
}

export interface Question {
  id: string; // UUID from backend
  group: TraitGroup;
  dimension: Dimension;
  text: string;
  options: AnswerOption[];
  required: boolean;
  audience?: Role;
  type?: "likert";
}

// ---------- Domain & Domain Scores ----------

export interface DomainItem {
  id: string;
  name: string;
  description: string | null;
}

export interface DomainScore {
  domainId: string;
  domain: string;
  fit: number;         // 0-100 scaled for display
  aptitude: number;    // 0-100 scaled for display
  interest: number;    // 0-100 scaled for display
  cognitive: number;   // 0-100 scaled for display
  cognitiveFit?: number; // alias for backwards compatibility
  composite?: number;    // alias for backwards compatibility
  raw: {
    fit: number;
    aptitude: number;
    interest: number;
    cognitive: number;
  };
}

export interface Trait {
  dimension: Dimension;
  group: TraitGroup;
  value: number | null; // 0..1
}

// ---------- Conflict Index & Gaps ----------

export interface ConflictGap {
  area: string;
  dimension: string;
  gap: number;
  text: string;
  studentValue: string;
  parentValue: string;
}

export interface ConflictResult {
  index: number;         // 0-100
  label: "low" | "moderate" | "high";
  topDisagreements: ConflictGap[];
  gaps: ConflictGap[];
}

// ---------- Finance ----------

export interface FinancePath {
  careerId: string;
  careerName: string;
  totalCost4Year: number;       // INR (finance.total_cost)
  totalCost: number;            // INR
  familyShare: number;          // INR (finance.capacity)
  capacity: number;             // INR
  loanNeeded: number;           // INR
  expectedStartingSalary: number; // INR (finance.starting_salary)
  startingSalary: number;       // INR
  breakEvenYears: number;       // finance.breakeven_years
  durationYears: number;
  isViable: boolean;            // finance.viable
  viable: boolean;
  failReason?: string;          // formatted from finance.reasons
  reasons: components["schemas"]["FinanceReason"][];
  cheaperAlternative?: string | null;
}

// ---------- Market ----------

export interface MarketRegionItem {
  region: string;
  demandIndex: number;       // 0-100
  medianSalary: number;      // INR annual
  growth: string;            // e.g. "+16%"
}

export interface MarketData {
  careerId: string;
  careerName: string;
  region: string;
  demandIndex: number;       // 0-100
  growthRate: number | null;
  growth: string;            // formatted e.g. "+22%"
  medianSalary: number | null;
  entrySalary: number | null;
  asOf: string;              // date string
  source: string;
  dataQuality: "sourced" | "estimated";
  regions: MarketRegionItem[];
}

// ---------- Roadmap & Careers ----------

export interface CollegeInfo {
  name: string;
  location?: string;
  ranking?: number;
  annualFee?: number;
}

export interface ExamInfo {
  name: string;
  date?: string;
  registrationDeadline?: string;
}

export interface ScholarshipInfo {
  name: string;
  amount: string;
  eligibility: string;
  deadline: string;
  matchedRule: string;
}

export interface CareerPath {
  id: string; // career_id
  rank: number;
  domain: string;
  title: string;
  career: string;
  finalScore: number;         // 0-100 display (scores.final_100)
  compositeScore: number;     // 0-100 display (round(scores.fit * 100))
  financialViability: number; // 0-100 display (round(scores.finance * 100))
  marketDemand: number;       // 0-100 display (round(scores.market * 100))
  financeViable: boolean;     // finance.viable
  rawScores: {
    fit: number;
    finance: number;
    market: number;
    final: number;
    final100: number;
  };
  finance: FinancePath;
  market: MarketData;
  exams: ExamInfo[];
  rawExams: string[];
  colleges: CollegeInfo[];
  scholarships: ScholarshipInfo[];
  timeline: string;
  cheaperAlternative: string | null;
  explanation?: string;
}

// ---------- SWOT ----------

export interface SwotItem {
  text: string;
  value: number;
  relatedDomain?: string;
  score?: number;
}

export interface SwotAnalysis {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

// ---------- Full Analyze Response ----------

export interface AnalyzeResponse {
  resultId: string;
  studentId?: string;
  parentId?: string;
  weights: {
    fit: number;
    finance: number;
    market: number;
  };
  domainScores: DomainScore[];
  traits: Trait[];
  conflict: ConflictResult;
  finance: FinancePath[];
  market: MarketData[];
  roadmap: CareerPath[];
  rejected: {
    careerId: string;
    career: string;
    reasons: components["schemas"]["FinanceReason"][];
    cheaperAlternative: string | null;
  }[];
  swot?: SwotAnalysis;
  createdAt: string;
  generatedAt: string; // alias for backwards compatibility
}

// ---------- Explain ----------

export interface ExplainResponse {
  careerId: string;
  text: string;
  source: "cache" | "gemini" | "template";
  explanation?: string; // backwards compatibility
}

// ---------- User & Profile ----------

export type MeResponse = components["schemas"]["MeResponse"];
export type ParentProfile = components["schemas"]["ParentProfile"];
export type StudentProfile = components["schemas"]["StudentProfile"];
export type CareerMarket = components["schemas"]["CareerMarket"];
export type DemoRunResponse = components["schemas"]["DemoRunResponse"];
export type LinkResponse = components["schemas"]["LinkResponse"];
export type InviteResponse = components["schemas"]["InviteResponse"];
export type ConsentResponse = components["schemas"]["ConsentResponse"];
