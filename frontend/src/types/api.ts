/* ============================================
   PRISM Engine — Shared API Types
   Matches the OpenAPI contract from backend.
   ============================================ */

// ---------- Questions ----------

export interface Question {
  id: string;
  audience: "student" | "parent";
  category: "aptitude" | "interest" | "thinking_style" | "budget" | "risk" | "aspiration";
  text: string;
  type: "likert" | "scale" | "choice" | "number" | "rank";
  options?: string[];
  min?: number;
  max?: number;
}

// ---------- Scores & Domains ----------

export interface DomainScore {
  domain: string;
  aptitude: number;      // 0-100
  interest: number;      // 0-100
  cognitiveFit: number;  // 0-100
  composite: number;     // weighted combination
}

// ---------- Conflict Index ----------

export interface ConflictResult {
  index: number;         // 0-100
  label: "low" | "moderate" | "high";
  topDisagreements: {
    area: string;
    studentValue: number;
    parentValue: number;
    gap: number;
  }[];
}

// ---------- Finance ----------

export interface FinancePath {
  careerId: string;
  careerName: string;
  totalCost4Year: number;       // INR
  familyShare: number;
  loanNeeded: number;
  expectedStartingSalary: number;
  breakEvenYears: number;
  isViable: boolean;
  failReason?: string;
  cheaperAlternative?: string;
}

// ---------- Market ----------

export interface MarketData {
  careerId: string;
  careerName: string;
  regions: {
    region: string;
    demandIndex: number;       // 0-100
    medianSalary: number;      // INR annual
    growth: string;            // e.g. "+12%"
  }[];
  source: string;
  asOf: string;                // ISO date
}

// ---------- Roadmap ----------

export interface CollegeInfo {
  name: string;
  location: string;
  ranking?: number;
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
}

export interface CareerPath {
  id: string;
  rank: number;
  domain: string;
  title: string;
  finalScore: number;
  compositeScore: number;
  financialViability: number;
  marketDemand: number;
  exams: ExamInfo[];
  colleges: CollegeInfo[];
  scholarships: ScholarshipInfo[];
  timeline: string;
  explanation?: string;
}

// ---------- SWOT ----------

export interface SwotItem {
  text: string;
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
  studentId: string;
  parentId: string;
  domainScores: DomainScore[];
  conflict: ConflictResult;
  finance: FinancePath[];
  market: MarketData[];
  roadmap: CareerPath[];
  swot?: SwotAnalysis;
  generatedAt: string;  // ISO datetime
}

// ---------- Explain ----------

export interface ExplainResponse {
  careerId: string;
  explanation: string;  // under 150 words, cites scores
}

// ---------- User ----------

export interface User {
  id: string;
  email: string;
  role: "student" | "parent";
  name: string;
  grade?: string;
  state?: string;
  linkedUserId?: string;
}
