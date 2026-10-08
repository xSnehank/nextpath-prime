import type { IndianState } from "@/types/api";

/** The 36 states and union territories, spelled exactly as the API expects. */
export const INDIAN_STATES: IndianState[] = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
];

export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "ews", label: "EWS" },
] as const;

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
] as const;

/** Class 11-12 streams, as the API expects them; the stream decides which careers come first. */
export const STREAMS = [
  { value: "science_pcm", label: "Science: PCM (Physics, Chemistry, Maths)" },
  { value: "science_pcb", label: "Science: PCB (Physics, Chemistry, Biology)" },
  { value: "science_pcmb", label: "Science: PCMB (Physics, Chemistry, Maths, Biology)" },
  { value: "commerce_maths", label: "Commerce with Maths" },
  { value: "commerce", label: "Commerce without Maths" },
  { value: "arts", label: "Arts / Humanities" },
  { value: "undecided", label: "Not decided yet (Class 10 or below)" },
] as const;

export const RISK_LEVELS = [
  { value: 1, label: "Very safe" },
  { value: 2, label: "Safe" },
  { value: 3, label: "Balanced" },
  { value: 4, label: "Open to risk" },
  { value: 5, label: "Very open" },
] as const;

/**
 * What each choice means and how the app uses it, shown in the hover hints (FieldHint).
 * Kept here so the student's and the parent's forms explain shared fields the same way.
 */
export const HINTS = {
  stream:
    "Your Class 11–12 subjects. Careers that follow your stream come first, and careers you can't enter (like B.Tech without Maths) are left out. In Class 10 or below? Pick “Not decided yet” to see every option.",
  homeState: "The state you live in now. Used only to find state scholarships you can apply for.",
  preferredState:
    "Where you'd like to study and work. If you and your parent pick different states, it shows up as a difference in the comparison.",
  studentRisk:
    "How comfortable you are with careers that are newer or less certain but may pay off more. Compared with your parent's answer.",
  studentAbroad: "Whether you'd consider studying abroad. Compared with your parent's answer.",
  category: "Optional. Only used to match scholarships reserved for a category. Never shown to anyone.",
  percentage: "Optional. Your latest board exam percentage, used for merit scholarships with a minimum score.",
  gender: "Optional. Some scholarships are only for girls; this lets us show them.",
  budget: "How much the family can spend on education each year, from regular income. Rupees, whole numbers.",
  savings: "Money already set aside for education. It's added to the yearly budget when we check what you can afford.",
  maxLoan:
    "The largest education loan you'd take for the whole course. Paths that need a bigger loan are marked not affordable.",
  income: "Optional. Yearly family income, used only to check scholarship income limits. Never shown to your child.",
  parentRisk: "How comfortable you are with newer or less certain careers. Compared with your child's answer.",
  breakeven:
    "How many years of your child's starting salary you'd accept to earn back the cost. Longer paths are marked not affordable.",
  parentState: "Where you'd like your child to study and work. Compared with your child's choice.",
  parentAbroad: "Whether you'd be open to your child studying abroad. Compared with your child's answer.",
  domains:
    "The three career areas you hope for, first choice first. We compare them with the areas your child is best suited to.",
} as const;
