/**
 * Mock data layer for PRISM Engine frontend.
 * This file serves as the data source until the FastAPI backend is live.
 * Every endpoint returns realistic demo data for the "Demo Family" flow.
 */

import type {
  Question,
  AnalyzeResponse,
  MarketData,
  ExplainResponse,
  DomainScore,
  ConflictResult,
  FinancePath,
  CareerPath,
  SwotAnalysis,
} from "@/types/api";

// ============ STUDENT QUESTIONS (30) ============

const studentQuestions: Question[] = [
  // Aptitude (10)
  { id: "s1", audience: "student", category: "aptitude", text: "I enjoy solving puzzles and logical problems.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s2", audience: "student", category: "aptitude", text: "I can easily understand graphs and data charts.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s3", audience: "student", category: "aptitude", text: "I am comfortable working with numbers and calculations.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s4", audience: "student", category: "aptitude", text: "I can explain complex ideas clearly to others.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s5", audience: "student", category: "aptitude", text: "I enjoy writing essays or stories.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s6", audience: "student", category: "aptitude", text: "I pay close attention to details in my work.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s7", audience: "student", category: "aptitude", text: "I can quickly spot patterns in information.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s8", audience: "student", category: "aptitude", text: "I am comfortable using computers and software.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s9", audience: "student", category: "aptitude", text: "I like working with my hands — building or fixing things.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s10", audience: "student", category: "aptitude", text: "I enjoy performing, presenting, or being on stage.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },

  // Interest (10)
  { id: "s11", audience: "student", category: "interest", text: "Which subject excites you the most?", type: "choice", options: ["Mathematics", "Science", "English / Languages", "Social Studies", "Computer Science", "Arts & Design", "Commerce", "Physical Education"] },
  { id: "s12", audience: "student", category: "interest", text: "I would rather spend a free hour…", type: "choice", options: ["Coding a small project", "Drawing or designing", "Reading about current events", "Conducting a science experiment", "Playing a sport", "Writing a blog post", "Learning about money and markets", "Volunteering for a cause"] },
  { id: "s13", audience: "student", category: "interest", text: "I enjoy learning about how businesses work.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s14", audience: "student", category: "interest", text: "I am curious about how the human body works.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s15", audience: "student", category: "interest", text: "I like exploring new places and cultures.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s16", audience: "student", category: "interest", text: "I want to build things that people use every day.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s17", audience: "student", category: "interest", text: "I follow news about technology and startups.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s18", audience: "student", category: "interest", text: "I enjoy teaching or mentoring younger students.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s19", audience: "student", category: "interest", text: "I am interested in law, policy, or governance.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s20", audience: "student", category: "interest", text: "I want to create visual content — videos, animations, or graphics.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },

  // Thinking style (10)
  { id: "s21", audience: "student", category: "thinking_style", text: "When solving a problem, I prefer to…", type: "choice", options: ["Break it into small logical steps", "Visualise the big picture first", "Discuss it with others", "Experiment and learn from mistakes"] },
  { id: "s22", audience: "student", category: "thinking_style", text: "I am more motivated by…", type: "choice", options: ["Achieving a personal goal", "Helping others succeed", "Being recognised by peers", "Learning something new"] },
  { id: "s23", audience: "student", category: "thinking_style", text: "I prefer working…", type: "choice", options: ["Alone with full focus", "In a small team", "In a large group", "Alternating solo and team"] },
  { id: "s24", audience: "student", category: "thinking_style", text: "When I hit a dead-end, I usually…", type: "choice", options: ["Try a completely new approach", "Research more before trying again", "Ask someone for help", "Take a break and revisit later"] },
  { id: "s25", audience: "student", category: "thinking_style", text: "I handle pressure by…", type: "choice", options: ["Making a to-do list", "Staying calm and adapting", "Seeking support from friends/family", "Channeling it into harder work"] },
  { id: "s26", audience: "student", category: "thinking_style", text: "I am comfortable with taking risks on new ideas.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s27", audience: "student", category: "thinking_style", text: "I prefer tasks with clear right/wrong answers over open-ended ones.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s28", audience: "student", category: "thinking_style", text: "I can stay focused on one task for a long time.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s29", audience: "student", category: "thinking_style", text: "I enjoy competitions and challenges.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s30", audience: "student", category: "thinking_style", text: "I often come up with creative or unusual solutions.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
];

// ============ PARENT QUESTIONS ============

const parentQuestions: Question[] = [
  { id: "p1", audience: "parent", category: "budget", text: "What is your family's annual budget for education? (in ₹)", type: "number", min: 0, max: 10000000 },
  { id: "p2", audience: "parent", category: "budget", text: "How much do you have saved for your child's higher education? (in ₹)", type: "number", min: 0, max: 50000000 },
  { id: "p3", audience: "parent", category: "budget", text: "How comfortable are you with taking an education loan?", type: "likert", options: ["Very Uncomfortable", "Uncomfortable", "Neutral", "Comfortable", "Very Comfortable"] },
  { id: "p4", audience: "parent", category: "budget", text: "What is the maximum loan amount you'd consider? (in ₹)", type: "number", min: 0, max: 50000000 },
  { id: "p5", audience: "parent", category: "risk", text: "How do you feel about your child pursuing a non-traditional career?", type: "likert", options: ["Strongly Against", "Against", "Neutral", "Open", "Strongly Open"] },
  { id: "p6", audience: "parent", category: "risk", text: "Would you support your child studying in another city or country?", type: "likert", options: ["Not At All", "Reluctantly", "Neutral", "Willingly", "Enthusiastically"] },
  { id: "p7", audience: "parent", category: "risk", text: "How important is job stability vs. passion for your child?", type: "scale", min: 1, max: 5 },
  { id: "p8", audience: "parent", category: "aspiration", text: "Rank your top 3 preferred career domains for your child.", type: "rank", options: ["Engineering / Technology", "Medicine / Healthcare", "Business / Management", "Law / Civil Services", "Arts / Design / Media", "Sciences / Research", "Education / Teaching", "Defence / Sports"] },
  { id: "p9", audience: "parent", category: "risk", text: "How important is the college brand/ranking to you?", type: "likert", options: ["Not Important", "Slightly Important", "Moderately Important", "Important", "Very Important"] },
  { id: "p10", audience: "parent", category: "aspiration", text: "Any specific expectations or concerns about your child's career? (Optional)", type: "choice", options: ["Want them near home", "Want international opportunities", "Prefer government/stable job", "Want entrepreneurial path", "No specific preference"] },
];

// ============ DOMAIN SCORES (Demo Family) ============

const demoDomainScores: DomainScore[] = [
  { domain: "Engineering / Technology", aptitude: 82, interest: 88, cognitiveFit: 79, composite: 83.6 },
  { domain: "Sciences / Research", aptitude: 78, interest: 72, cognitiveFit: 81, composite: 76.4 },
  { domain: "Business / Management", aptitude: 71, interest: 65, cognitiveFit: 68, composite: 68.2 },
  { domain: "Medicine / Healthcare", aptitude: 65, interest: 58, cognitiveFit: 72, composite: 64.2 },
  { domain: "Arts / Design / Media", aptitude: 55, interest: 78, cognitiveFit: 60, composite: 64.8 },
  { domain: "Law / Civil Services", aptitude: 60, interest: 45, cognitiveFit: 65, composite: 56.0 },
  { domain: "Education / Teaching", aptitude: 58, interest: 52, cognitiveFit: 61, composite: 56.6 },
  { domain: "Defence / Sports", aptitude: 50, interest: 40, cognitiveFit: 48, composite: 46.0 },
];

// ============ CONFLICT INDEX ============

const demoConflict: ConflictResult = {
  index: 42,
  label: "moderate",
  topDisagreements: [
    { area: "Risk Appetite", studentValue: 78, parentValue: 35, gap: 43 },
    { area: "Location Preference", studentValue: 85, parentValue: 50, gap: 35 },
    { area: "Domain Priority", studentValue: 90, parentValue: 62, gap: 28 },
  ],
};

// ============ FINANCE ============

const demoFinance: FinancePath[] = [
  { careerId: "c1", careerName: "Software Engineering", totalCost4Year: 1200000, familyShare: 800000, loanNeeded: 400000, expectedStartingSalary: 1200000, breakEvenYears: 1.0, isViable: true },
  { careerId: "c2", careerName: "Data Science / AI", totalCost4Year: 1400000, familyShare: 800000, loanNeeded: 600000, expectedStartingSalary: 1400000, breakEvenYears: 1.0, isViable: true },
  { careerId: "c3", careerName: "Product Design (UX)", totalCost4Year: 900000, familyShare: 700000, loanNeeded: 200000, expectedStartingSalary: 800000, breakEvenYears: 1.1, isViable: true },
  { careerId: "c4", careerName: "Biotechnology", totalCost4Year: 1600000, familyShare: 800000, loanNeeded: 800000, expectedStartingSalary: 600000, breakEvenYears: 2.7, isViable: true },
  { careerId: "c5", careerName: "MBBS / Medicine", totalCost4Year: 4000000, familyShare: 800000, loanNeeded: 3200000, expectedStartingSalary: 720000, breakEvenYears: 5.6, isViable: false, failReason: "Loan exceeds family tolerance of ₹20L", cheaperAlternative: "BSc Nursing or Allied Health Sciences" },
];

// ============ MARKET DATA ============

const demoMarket: MarketData[] = [
  {
    careerId: "c1", careerName: "Software Engineering",
    regions: [
      { region: "Bengaluru", demandIndex: 92, medianSalary: 1400000, growth: "+15%" },
      { region: "Hyderabad", demandIndex: 88, medianSalary: 1200000, growth: "+12%" },
      { region: "Pune", demandIndex: 82, medianSalary: 1100000, growth: "+10%" },
      { region: "NCR", demandIndex: 78, medianSalary: 1050000, growth: "+8%" },
    ],
    source: "NASSCOM / LinkedIn Jobs Data (curated)", asOf: "2024-10-01",
  },
  {
    careerId: "c2", careerName: "Data Science / AI",
    regions: [
      { region: "Bengaluru", demandIndex: 95, medianSalary: 1600000, growth: "+22%" },
      { region: "Hyderabad", demandIndex: 85, medianSalary: 1300000, growth: "+18%" },
      { region: "Mumbai", demandIndex: 80, medianSalary: 1250000, growth: "+14%" },
      { region: "Chennai", demandIndex: 72, medianSalary: 1100000, growth: "+12%" },
    ],
    source: "NASSCOM / LinkedIn Jobs Data (curated)", asOf: "2024-10-01",
  },
  {
    careerId: "c3", careerName: "Product Design (UX)",
    regions: [
      { region: "Bengaluru", demandIndex: 78, medianSalary: 1000000, growth: "+20%" },
      { region: "Mumbai", demandIndex: 72, medianSalary: 900000, growth: "+16%" },
      { region: "Pune", demandIndex: 65, medianSalary: 800000, growth: "+14%" },
    ],
    source: "Glassdoor / AngelList (curated)", asOf: "2024-09-15",
  },
  {
    careerId: "c4", careerName: "Biotechnology",
    regions: [
      { region: "Hyderabad", demandIndex: 65, medianSalary: 650000, growth: "+8%" },
      { region: "Bengaluru", demandIndex: 60, medianSalary: 600000, growth: "+6%" },
      { region: "Pune", demandIndex: 55, medianSalary: 550000, growth: "+5%" },
    ],
    source: "BioSpectrum India (curated)", asOf: "2024-08-01",
  },
  {
    careerId: "c5", careerName: "MBBS / Medicine",
    regions: [
      { region: "All India", demandIndex: 70, medianSalary: 720000, growth: "+4%" },
      { region: "Metro cities", demandIndex: 75, medianSalary: 900000, growth: "+5%" },
    ],
    source: "NMC / MCI data (curated)", asOf: "2024-07-01",
  },
];

// ============ ROADMAP ============

const demoRoadmap: CareerPath[] = [
  {
    id: "c1", rank: 1, domain: "Engineering / Technology", title: "Software Engineering",
    finalScore: 86.2, compositeScore: 83.6, financialViability: 92, marketDemand: 90,
    exams: [
      { name: "JEE Main", date: "Jan & Apr 2025", registrationDeadline: "Nov 2024" },
      { name: "JEE Advanced", date: "May 2025", registrationDeadline: "Apr 2025" },
      { name: "BITSAT", date: "May 2025", registrationDeadline: "Mar 2025" },
    ],
    colleges: [
      { name: "IIT Bombay", location: "Mumbai", ranking: 1 },
      { name: "BITS Pilani", location: "Pilani", ranking: 8 },
      { name: "IIIT Hyderabad", location: "Hyderabad", ranking: 12 },
    ],
    scholarships: [
      { name: "INSPIRE Scholarship", amount: "₹80,000/year", eligibility: "Top 1% in Board Exams", deadline: "Oct 2025" },
      { name: "Kishore Vaigyanik Protsahan Yojana", amount: "₹5,000-7,000/month", eligibility: "XI-XII Science students", deadline: "Aug 2025" },
      { name: "Sitaram Jindal Foundation", amount: "Up to ₹2,00,000", eligibility: "Family income < ₹2.5L/year", deadline: "Dec 2025" },
    ],
    timeline: "4-year B.Tech → Campus placement or MS abroad",
  },
  {
    id: "c2", rank: 2, domain: "Engineering / Technology", title: "Data Science / AI",
    finalScore: 82.8, compositeScore: 76.4, financialViability: 88, marketDemand: 95,
    exams: [
      { name: "JEE Main", date: "Jan & Apr 2025" },
      { name: "CUET", date: "May 2025" },
    ],
    colleges: [
      { name: "IIT Delhi", location: "New Delhi", ranking: 2 },
      { name: "IISC Bangalore", location: "Bengaluru", ranking: 3 },
      { name: "Chennai Mathematical Institute", location: "Chennai", ranking: 15 },
    ],
    scholarships: [
      { name: "Google Generation Scholarship", amount: "₹56,000 (one-time)", eligibility: "Undergrad CS/related", deadline: "Apr 2025" },
      { name: "Narotam Sekhsaria Scholarship", amount: "Interest-free loan up to ₹20L", eligibility: "Indian national, merit-based", deadline: "Mar 2025" },
      { name: "Aditya Birla Scholarship", amount: "₹1,75,000/year", eligibility: "Top institutes admission", deadline: "Aug 2025" },
    ],
    timeline: "4-year B.Tech (CS/AI) → Industry or M.Tech/MS",
  },
  {
    id: "c3", rank: 3, domain: "Arts / Design / Media", title: "Product Design (UX)",
    finalScore: 72.5, compositeScore: 64.8, financialViability: 85, marketDemand: 78,
    exams: [
      { name: "NID DAT", date: "Jan 2025" },
      { name: "UCEED", date: "Jan 2025" },
    ],
    colleges: [
      { name: "NID Ahmedabad", location: "Ahmedabad", ranking: 1 },
      { name: "IIT Bombay (IDC)", location: "Mumbai", ranking: 3 },
      { name: "Srishti Manipal", location: "Bengaluru", ranking: 10 },
    ],
    scholarships: [
      { name: "NID Merit Scholarship", amount: "Full tuition waiver", eligibility: "Top rank in NID DAT", deadline: "Jul 2025" },
      { name: "Pratibha Kiran Scholarship", amount: "₹40,000/year", eligibility: "Girls from BPL families", deadline: "Nov 2025" },
      { name: "HDFC Educational Crisis Scholarship", amount: "Up to ₹75,000", eligibility: "Crisis-affected families", deadline: "Rolling" },
    ],
    timeline: "4-year B.Des → UX/UI roles or startup",
  },
  {
    id: "c4", rank: 4, domain: "Sciences / Research", title: "Biotechnology",
    finalScore: 65.3, compositeScore: 76.4, financialViability: 60, marketDemand: 55,
    exams: [
      { name: "ICAR AIEEA", date: "Jun 2025" },
      { name: "GAT-B", date: "Apr 2025" },
    ],
    colleges: [
      { name: "IIT Kharagpur", location: "Kharagpur", ranking: 4 },
      { name: "ICT Mumbai", location: "Mumbai", ranking: 7 },
      { name: "Anna University", location: "Chennai", ranking: 20 },
    ],
    scholarships: [
      { name: "DBT Junior Research Fellowship", amount: "₹31,000/month", eligibility: "Post-MSc, GATE qualified", deadline: "Rolling" },
      { name: "CSIR NET Fellowship", amount: "₹31,000/month", eligibility: "MSc + NET", deadline: "Jun 2025" },
      { name: "Tata Trusts Scholarship", amount: "Varies", eligibility: "Merit + need", deadline: "Sep 2025" },
    ],
    timeline: "4-year B.Tech Biotech → MS/PhD or Industry R&D",
  },
  {
    id: "c5", rank: 5, domain: "Medicine / Healthcare", title: "MBBS / Medicine",
    finalScore: 58.1, compositeScore: 64.2, financialViability: 30, marketDemand: 70,
    exams: [
      { name: "NEET UG", date: "May 2025", registrationDeadline: "Mar 2025" },
    ],
    colleges: [
      { name: "AIIMS Delhi", location: "New Delhi", ranking: 1 },
      { name: "CMC Vellore", location: "Vellore", ranking: 3 },
      { name: "JIPMER", location: "Puducherry", ranking: 5 },
    ],
    scholarships: [
      { name: "AIIMS Full Scholarship", amount: "Full fee waiver + stipend", eligibility: "AIIMS admission", deadline: "Aug 2025" },
      { name: "Post-Matric SC/ST Scholarship", amount: "Full maintenance", eligibility: "SC/ST category", deadline: "Nov 2025" },
      { name: "Maulana Azad Fellowship", amount: "₹31,000/month", eligibility: "Minority community", deadline: "Rolling" },
    ],
    timeline: "5.5-year MBBS + 3-year MD → Practice",
  },
];

// ============ SWOT (P1 but included for completeness) ============

const demoSwot: SwotAnalysis = {
  strengths: [
    { text: "Strong logical reasoning and pattern recognition", relatedDomain: "Engineering / Technology", score: 82 },
    { text: "High interest in technology and building products", relatedDomain: "Engineering / Technology", score: 88 },
    { text: "Good analytical skills across science domains", relatedDomain: "Sciences / Research", score: 78 },
  ],
  weaknesses: [
    { text: "Lower interest in structured/traditional career paths", relatedDomain: "Law / Civil Services", score: 45 },
    { text: "Moderate communication and presentation skills", relatedDomain: "Business / Management", score: 55 },
  ],
  opportunities: [
    { text: "Booming AI/ML job market with 22% annual growth", relatedDomain: "Engineering / Technology" },
    { text: "Strong scholarship opportunities for top-performing students", relatedDomain: "Engineering / Technology" },
    { text: "Growing demand for UX designers in India (+20%)", relatedDomain: "Arts / Design / Media" },
  ],
  threats: [
    { text: "Family budget limits high-cost options like MBBS", relatedDomain: "Medicine / Healthcare" },
    { text: "Moderate parent-student conflict may cause decision delays", relatedDomain: "General" },
  ],
};

// ============ FULL ANALYZE RESPONSE ============

const demoAnalyzeResponse: AnalyzeResponse = {
  studentId: "demo-student-001",
  parentId: "demo-parent-001",
  domainScores: demoDomainScores,
  conflict: demoConflict,
  finance: demoFinance,
  market: demoMarket,
  roadmap: demoRoadmap,
  swot: demoSwot,
  generatedAt: new Date().toISOString(),
};

// ============ MOCK RESOLVER ============

type MockHandler = (path: string, options?: RequestInit) => unknown;

const routes: Record<string, MockHandler> = {
  "/questions": (path) => {
    const audience = new URL(`http://x${path}`).searchParams.get("audience");
    return audience === "parent" ? parentQuestions : studentQuestions;
  },
  "/responses": () => ({ ok: true }),
  "/auth/link": () => ({ ok: true }),
  "/analyze": () => demoAnalyzeResponse,
  "/explain": (_path, options) => {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const career = demoRoadmap.find((c) => c.id === body.careerId);
    return {
      careerId: body.careerId ?? "c1",
      explanation: career
        ? `Based on your assessment, ${career.title} ranks #${career.rank} with a composite score of ${career.compositeScore}/100. Your aptitude aligns strongly with the ${career.domain} domain. Financial viability is ${career.financialViability}% and market demand is at ${career.marketDemand}%. This path offers a ${career.timeline.toLowerCase()}, with multiple scholarship opportunities to offset costs.`
        : "Career explanation not available.",
    };
  },
};

/**
 * Resolve a mock API call.
 * Simulates 300-800ms network latency for realistic UX testing.
 */
export async function resolve<T>(path: string, options?: RequestInit): Promise<T> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

  // Match route by prefix
  const routeKey = Object.keys(routes).find((key) => path.startsWith(key));
  if (routeKey) {
    return routes[routeKey](path, options) as T;
  }

  // /careers/{id}/market
  const marketMatch = path.match(/^\/careers\/(.+)\/market$/);
  if (marketMatch) {
    const found = demoMarket.find((m) => m.careerId === marketMatch[1]);
    return (found ?? demoMarket[0]) as T;
  }

  // /results/{id}
  const resultsMatch = path.match(/^\/results\//);
  if (resultsMatch) {
    return demoAnalyzeResponse as T;
  }

  throw new Error(`Mock: no handler for ${path}`);
}

// Export demo data for the one-click demo button
export const DEMO_DATA = {
  analyzeResponse: demoAnalyzeResponse,
  studentQuestions,
  parentQuestions,
};
