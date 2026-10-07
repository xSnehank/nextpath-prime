import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { FloatingPillNavbar } from "@/components/FloatingPillNavbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextPath — The Career Intelligence Engine for Indian Families",
  description:
    "NextPath mathematically harmonizes student psychometric profiles, parental financial realities, and live job-market demand into ranked, affordable roadmaps. Built for DataQuest 3.0 (DQNM).",
  keywords: [
    "NextPath",
    "DataQuest 3.0",
    "Career Intelligence",
    "Student Psychometrics",
    "Financial Constraint Solver",
    "Parent Student Conflict Index",
    "STEAM Careers",
    "India Career Roadmap",
  ],
  authors: [{ name: "Aayush - Frontend Lead" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#08090a] text-[#eeeee8] font-sans selection:bg-[#d4ff3a] selection:text-[#08090a]">
        <FloatingPillNavbar />
        <main className="flex-1 flex flex-col pt-16 sm:pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
