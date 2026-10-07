import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] font-semibold shadow-sm shadow-[#d4ff3a]/25",
        secondary:
          "bg-[#16181b] hover:bg-[#1f2227] text-[#eeeee8] border border-white/10",
        outline:
          "border border-white/15 bg-transparent hover:bg-white/[0.05] text-[#eeeee8]",
        ghost:
          "text-[#75766f] hover:text-[#eeeee8] hover:bg-white/[0.05]",
        destructive:
          "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
        glow:
          "bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] font-semibold shadow-lg shadow-[#d4ff3a]/30",
        volt:
          "bg-[#d4ff3a] hover:bg-[#bcf01a] text-[#08090a] font-semibold shadow-sm",
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
