import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-violet-500/20 text-violet-300 border border-violet-500/30",
        secondary:
          "bg-white/10 text-slate-300 border border-white/10",
        outline:
          "text-slate-400 border border-white/20",
        success:
          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        warning:
          "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        danger:
          "bg-rose-500/20 text-rose-300 border border-rose-500/30",
        cyan:
          "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
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
