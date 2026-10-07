"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Sparkles, Menu, X, ArrowRight, Brain, Banknote, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Overview", href: "/", icon: Compass },
  { id: "student", label: "Student Test", href: "/assessment/student", icon: Brain },
  { id: "parent", label: "Parent Portal", href: "/assessment/parent", icon: Banknote },
  { id: "dashboard", label: "Roadmap Demo", href: "/dashboard", icon: LayoutDashboard },
];

export function FloatingPillNavbar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Detect scroll to adjust pill shadow & opacity
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine active item from current route
  const getActiveItemId = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/assessment/student")) return "student";
    if (pathname.startsWith("/assessment/parent") || pathname.startsWith("/parent")) return "parent";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return "home";
  };

  const activeId = getActiveItemId();

  return (
    <>
      {/* Floating Pill Fixed Container */}
      <header className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-1 sm:gap-3 rounded-full border px-2 sm:px-3 py-1.5 sm:py-2 transition-all duration-300 shadow-2xl",
            scrolled
              ? "border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-violet-950/30"
              : "border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-black/40"
          )}
        >
          {/* Brand Mark (Left of Pill) */}
          <Link
            href="/"
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full group select-none"
            aria-label="PRISM Engine Home"
          >
            <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-300 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-black tracking-tight text-white font-[Outfit,sans-serif] leading-none">
                PRISM<span className="text-cyan-400 font-normal">ENGINE</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Framer-style Spring Pill Indicator */}
          <nav
            className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/5 relative"
            onMouseLeave={() => setHoveredItem(null)}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              const isHovered = hoveredItem === item.id;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  className={cn(
                    "relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 select-none flex items-center gap-1.5 z-10",
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {/* Framer-style Spring Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600/90 to-indigo-600/90 shadow-md shadow-violet-600/30 border border-violet-400/30 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                        mass: 0.8,
                      }}
                    />
                  )}

                  {/* Hover Pill Highlight */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="hoverPill"
                      className="absolute inset-0 rounded-full bg-white/5 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {Icon && (
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive ? "text-cyan-300" : "text-slate-500"
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA (Pill End) */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <Link href="/dashboard" className="hidden sm:inline-block">
              <button className="relative group overflow-hidden rounded-full p-[1px] font-semibold text-xs transition-all active:scale-95 cursor-pointer">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full group-hover:opacity-100 opacity-80 transition-opacity" />
                <span className="relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-slate-950 text-white text-xs font-semibold group-hover:bg-slate-950/80 transition-colors">
                  <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                  <span>1-Click Demo</span>
                </span>
              </button>
            </Link>

            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
              aria-label="Toggle Mobile Navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Drawer (Accessible at 375px Viewport) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-20 left-4 right-4 z-50 rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-violet-600/20 text-cyan-300 border border-violet-500/30"
                        : "text-slate-300 hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className="h-4 w-4 text-violet-400" />}
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 mt-2 border-t border-white/10">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Launch 1-Click Demo Family</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
