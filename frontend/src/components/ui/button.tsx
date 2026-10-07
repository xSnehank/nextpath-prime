import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:brightness-110",
        secondary:
          "bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 backdrop-blur-md",
        outline:
          "border border-white/20 bg-transparent hover:bg-white/5 text-slate-200",
        ghost:
          "text-slate-300 hover:text-white hover:bg-white/5",
        destructive:
          "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
        glow:
          "relative overflow-hidden bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base font-semibold",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
