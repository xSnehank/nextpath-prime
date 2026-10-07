"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Users } from "lucide-react";
import { DEMO_DATA } from "@/mocks";

interface DemoFamilyButtonProps {
  variant?: "default" | "secondary" | "outline" | "glow";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function DemoFamilyButton({
  variant = "glow",
  size = "default",
  className,
  showIcon = true,
  label = "1-Click Demo Family",
}: DemoFamilyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLoadDemo = () => {
    setLoading(true);
    try {
      // Store mock user & analysis state in localStorage for persistent demo flow
      localStorage.setItem("prism_student_id", "demo-student-001");
      localStorage.setItem("prism_student_name", "Aarav Sharma");
      localStorage.setItem("prism_student_grade", "Grade 11 (PCM)");
      localStorage.setItem("prism_student_state", "Maharashtra");

      localStorage.setItem("prism_parent_id", "demo-parent-001");
      localStorage.setItem("prism_parent_name", "Rajesh Sharma");
      localStorage.setItem("prism_parent_budget", "800000");
      localStorage.setItem("prism_parent_savings", "1200000");
      localStorage.setItem("prism_parent_loan_tolerance", "4");
      localStorage.setItem("prism_parent_risk_appetite", "2");

      localStorage.setItem("prism_analysis_data", JSON.stringify(DEMO_DATA.analyzeResponse));
      localStorage.setItem("prism_is_demo", "true");

      // Navigate to comprehensive dashboard
      router.push("/dashboard");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLoadDemo}
      disabled={loading}
      id="one-click-demo-button"
    >
      {showIcon && (
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-cyan-300" />
          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
        </span>
      )}
      <span>{loading ? "Loading Roadmap..." : label}</span>
    </Button>
  );
}
