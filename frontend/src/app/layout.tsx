import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
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
  title: "PRISM Engine | Multi-Vector Career Guidance & SWOT Analytics",
  description:
    "AI-powered multi-vector career guidance platform harmonizing student psychometric profiles, parental financial realities, and live job-market demand into ranked, affordable roadmaps. Built for DataQuest 3.0 (DQNM).",
  keywords: [
    "PRISM Engine",
    "DataQuest 3.0",
    "Career Guidance",
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
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-slate-100 font-sans selection:bg-violet-600/30 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
