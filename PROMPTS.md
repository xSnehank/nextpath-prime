# Prompt Log (PROMPTS.md)
Best prompts used with AI tools, and what they produced (proof of AI-led build).

---

## PRISM Engine — Frontend AI Prompts Log

**Team Member**: Aayush (Frontend Lead)  
**Problem Statement**: PRISM Engine (DataQuest 3.0, problem DQNM)  
**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, React Hook Form, Zod, jsPDF, Lucide React

---

### Prompt 1: Project Scaffold & Design System
> "Initialize Next.js App Router with TypeScript and Tailwind CSS. Implement a dark-first luxury prismatic theme with cyan, violet, and indigo gradients, glassmorphism card surfaces, and accessible semantic colors for student aptitude, parental constraints, and conflict gauge levels."

### Prompt 2: API Contract & Mock Data Layer
> "Define full TypeScript interfaces for OpenAPI contract: DomainScore, ConflictResult, FinancePath, MarketData, CareerPath, SwotAnalysis, and AnalyzeResponse. Create a zero-latency fallback mock layer with 30 student psychometric questions, 10 parent questions, and a pre-configured sample demo family with realistic Indian education costs and career trajectories."

### Prompt 3: UI Primitives & Glassmorphic Component Library
> "Create accessible, modular shadcn/ui-inspired primitives (Button, Card, Input, Slider, Progress, Badge, Tabs) styled with Tailwind CSS, custom glass effects, and micro-animations."

### Prompt 4: Student Assessment Flow (Epic B1)
> "Create a 30-question student assessment page with 1-question-per-screen layout, animated progress bar, category indicators (aptitude, interest, thinking style), auto-save to localStorage for pause/resume, and keyboard navigation."

### Prompt 5: Parent Assessment & Constraint Vectorization (Epic B2, B3)
> "Build a parent assessment form validating INR budget, savings, 5-point loan tolerance, 5-point risk appetite, and an interactive top-3 domain ranking selector with real-time feedback."

### Prompt 6: Conflict Index Gauge & SWOT Matrix (Epic C2, C3)
> "Implement a custom SVG semicircle gauge visualizing the Parent-Student Conflict Index (0-100) with low/moderate/high semantic badges and a breakdown of the top 3 friction points. Build an interactive 4-quadrant SWOT analytics matrix mapped to psychometric scores."

### Prompt 7: Financial Solver & Regional Labor Market Intelligence (Epic D1, D2)
> "Build the Financial Constraint Solver card showing 4-year cost, family share, loan requirements, break-even years, and flagged unviable paths with cheaper STEAM alternatives. Pair with an interactive Indian regional hiring demand and median salary visualizer with verified sources."

### Prompt 8: Ranked Career Roadmap & Scholarships (Epic E1, E2, E3, E4)
> "Create the multi-path career roadmap displaying top 5 recommendations with composite match scores, entrance examinations (JEE/NEET/NID/CUET), NIRF top institutions, targeted scholarships with deadlines, AI plain-language reasoning, and one-click PDF export."
