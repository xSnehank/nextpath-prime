import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: "NextPath — Career planning for Indian families",
  description:
    "NextPath combines a student's strengths, the family's budget and job-market data into a ranked, affordable career plan. Built for DataQuest 3.0 (DQNM).",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Runs before the first paint, so a visitor who chose dark mode never sees a white flash.
// Light is the default whatever the device setting; only an explicit choice switches it.
const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
