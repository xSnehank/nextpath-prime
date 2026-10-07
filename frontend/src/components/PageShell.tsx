import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** A centred page with a title and an optional one-line subtitle. */
export function PageShell({
  title,
  subtitle,
  width = "sm",
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const max = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-3xl" }[width];
  return (
    <div className={cn("mx-auto w-full px-4 py-10 sm:py-14", max)}>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

const NOTICE_STYLES = {
  error: { box: "border-danger/30 bg-danger-soft text-danger", Icon: AlertCircle },
  success: { box: "border-success/30 bg-success-soft text-success", Icon: CheckCircle2 },
  info: { box: "border-border bg-muted text-foreground", Icon: Info },
} as const;

/** A one-line message: an error, a success or a neutral note. */
export function Notice({
  tone = "error",
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_STYLES;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = NOTICE_STYLES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

/** A plain text field label (no hint). */
export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25";
