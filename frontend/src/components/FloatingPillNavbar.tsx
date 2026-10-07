"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight, Brain, Banknote, LayoutDashboard, Compass } from "lucide-react";
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
      <header className="fixed top-4 sm:top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-1 sm:gap-2.5 rounded-full border px-2 sm:px-2.5 py-1.5 transition-all duration-300 shadow-2xl",
            scrolled
              ? "border-white/[0.12] bg-[#08090a]/92 backdrop-blur-2xl shadow-black/70"
              : "border-white/[0.08] bg-[#0d0e10]/85 backdrop-blur-xl shadow-black/50"
          )}
        >
          {/* Brand Mark (Left of Pill) */}
          <Link
            href="/"
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full group select-none"
            aria-label="NextPath Home"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#16181b] border border-white/10 group-hover:border-[#d4ff3a]/50 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#d4ff3a]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-[#eeeee8] font-sans">
                Next<span className="text-[#d4ff3a]">Path</span>
              </span>
              <span className="hidden lg:inline-flex text-[9px] font-mono uppercase tracking-widest text-[#75766f] border border-white/10 px-1.5 py-0.5 rounded-full">
                DQNM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Framer-style Spring Pill Indicator */}
          <nav
            className="hidden md:flex items-center gap-0.5 p-1 rounded-full bg-white/[0.02] border border-white/[0.05] relative"
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
                    "relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 select-none flex items-center gap-1.5 z-10",
                    isActive ? "text-[#eeeee8]" : "text-[#75766f] hover:text-[#dcdcd3]"
                  )}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full bg-[#1a1c21] border border-white/10 shadow-sm -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                    />
                  )}

                  {/* Hover Highlight */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="hoverPill"
                      className="absolute inset-0 rounded-full bg-white/[0.04] -z-10"
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
                        isActive ? "text-[#d4ff3a]" : "text-[#75766f]"
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA (Pill End) */}
          <div className="flex items-center gap-1.5 pl-1">
            <Link href="/dashboard" className="hidden sm:inline-block">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] text-xs font-semibold tracking-tight transition-all active:scale-95 cursor-pointer shadow-sm shadow-[#d4ff3a]/20">
                <span>Live Demo</span>
                <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
              </span>
            </Link>

            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-[#eeeee8] border border-white/10 hover:bg-white/10"
              aria-label="Toggle Mobile Navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-20 left-4 right-4 z-50 rounded-2xl border border-white/10 bg-[#0d0e10]/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors",
                      isActive
                        ? "bg-[#16181b] text-[#d4ff3a] border border-[#d4ff3a]/20"
                        : "text-[#75766f] hover:bg-white/[0.03] hover:text-[#eeeee8]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#d4ff3a]" />}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 mt-2 border-t border-white/[0.08]">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] font-semibold text-xs transition-colors">
                  <span>Launch 1-Click Demo Family</span>
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
