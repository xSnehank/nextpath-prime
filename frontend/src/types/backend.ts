/**
 * Backend OpenAPI Contract Types (snake_case)
 * Matches backend/openapi/openapi.json from chore/be-openapi-contract.
 */

export interface BackendDisagreement {
  area: string;
  student_value: number;
  parent_value: number;
  gap: number;
}

export interface BackendConflict {
  index: number;
  label: "low" | "moderate" | "high";
  top_disagreements: BackendDisagreement[];
}

export interface BackendDomainScore {
  domain: string;
  aptitude?: number;
  interest?: number;
  cognitive_fit?: number;
  composite: number;
}

export interface BackendTrait {
  trait: string;
  score: number;
  category: "aptitude" | "interest" | "thinking_style";
}

export interface BackendRegionData {
  region: string;
  demand_index: number;
  median_salary: number;
  growth_rate: string;
}

export interface BackendCareerFinance {
  total_cost_4_year: number;
  family_share: number;
  loan_needed: number;
  expected_starting_salary: number;
  break_even_years: number;
  is_viable: boolean;
  fail_reason?: string;
  cheaper_alternative?: string;
}

export interface BackendCareerMarket {
  regions: BackendRegionData[];
  source: string;
  as_of: string;
}

export interface BackendExam {
  name: string;
  date?: string;
  registration_deadline?: string;
}

export interface BackendCollege {
  name: string;
  location: string;
  ranking?: number;
}

export interface BackendScholarship {
  name: string;
  amount: string;
  eligibility: string;
  deadline: string;
}

export interface BackendCareerItem {
  id: string;
  rank: number;
  domain: string;
  title: string;
  final_score: number;
  composite_score: number;
  financial_viability: number;
  market_demand: number;
  timeline: string;
  explanation?: string;
  finance: BackendCareerFinance;
  market: BackendCareerMarket;
  path: {
    exams: BackendExam[];
    colleges: BackendCollege[];
  };
  scholarships: BackendScholarship[];
}

export interface BackendSwotItem {
  text: string;
  related_domain?: string;
  score?: number;
}

export interface BackendSwot {
  strengths: BackendSwotItem[];
  weaknesses: BackendSwotItem[];
  opportunities: BackendSwotItem[];
  threats: BackendSwotItem[];
}

export interface BackendAnalyzeResponse {
  student_id: string;
  parent_id: string;
  traits?: BackendTrait[];
  domain_scores: BackendDomainScore[];
  conflict: BackendConflict;
  roadmap: BackendCareerItem[];
  swot?: BackendSwot;
  generated_at: string;
}

export interface BackendProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "parent";
  grade?: string;
  state?: string;
  annual_budget?: number;
  savings?: number;
  max_loan?: number;
  loan_comfort?: number;
  risk_appetite?: number;
  geographic_flexibility?: number;
  ranked_domains?: string[];
  notes?: string;
}
