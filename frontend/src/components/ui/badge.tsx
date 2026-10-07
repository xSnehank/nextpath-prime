import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[#d4ff3a]/10 text-[#d4ff3a] border border-[#d4ff3a]/30 font-mono text-[11px]",
        secondary:
          "bg-white/[0.05] text-[#eeeee8] border border-white/10 font-mono text-[11px]",
        outline:
          "text-[#75766f] border border-white/10 font-mono text-[11px]",
        success:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]",
        warning:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono text-[11px]",
        danger:
          "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-[11px]",
        cyan:
          "bg-[#d4ff3a]/15 text-[#d4ff3a] border border-[#d4ff3a]/30 font-mono text-[11px]",
        volt:
          "bg-[#d4ff3a] text-[#08090a] font-semibold border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
