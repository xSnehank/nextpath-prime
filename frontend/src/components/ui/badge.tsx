import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-accent border border-primary/40",
        secondary: "bg-muted text-foreground border border-border",
        outline: "text-muted-foreground border border-border",
        success: "bg-success-soft text-success border border-success/30",
        warning: "bg-warning-soft text-warning border border-warning/30",
        danger: "bg-danger-soft text-danger border border-danger/30",
        cyan: "bg-primary/15 text-accent border border-primary/40",
        volt: "bg-primary text-primary-foreground border-transparent",
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
