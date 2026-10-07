"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoFamilyButton } from "./DemoFamilyButton";
import { Compass, Menu, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/assessment/student", label: "Student Test" },
  { href: "/parent/join", label: "Parent Link" },
  { href: "/assessment/parent", label: "Parent Form" },
  { href: "/dashboard", label: "Roadmap Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Compass className="h-5 w-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white font-[Outfit,sans-serif]">
              PRISM<span className="text-cyan-400 font-normal ml-0.5">ENGINE</span>
            </span>
            <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase -mt-1">
              DataQuest 3.0
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white font-semibold shadow-inner"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA & Demo Button */}
        <div className="hidden sm:flex items-center gap-3">
          <DemoFamilyButton size="sm" />
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/10 bg-slate-950/95 px-4 pt-2 pb-6 space-y-3 backdrop-blur-2xl animate-fade-in-up">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-violet-600/20 text-cyan-300 font-semibold border border-violet-500/30"
                    : "text-slate-300 hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <DemoFamilyButton size="sm" className="w-full justify-center" />
          </div>
        </div>
      )}
    </header>
  );
}
