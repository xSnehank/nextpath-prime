"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldHintProps {
  /** The field's label text. */
  label: React.ReactNode;
  /** What the field means and how it's used, in one or two plain sentences. */
  hint: string;
  /** id of the input this labels, if any. */
  htmlFor?: string;
  className?: string;
}

const BOX_WIDTH = 280;
const GAP = 18; // below the cursor
const EDGE = 8;

/**
 * A field label with an explanation that follows just below the cursor while hovered.
 * Keyboard users get it below the label on focus; touch users tap the label to open or close it.
 * It renders on document.body, so cards with blur or overflow can't clip it.
 */
export function FieldHint({ label, hint, htmlFor, className }: FieldHintProps) {
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const hintId = React.useId();

  const placeAt = React.useCallback((x: number, y: number) => {
    const height = boxRef.current?.offsetHeight ?? 64;
    const left = Math.min(Math.max(EDGE, x - 16), window.innerWidth - BOX_WIDTH - EDGE);
    let top = y + GAP;
    if (top + height > window.innerHeight - EDGE) top = Math.max(EDGE, y - height - 10); // no room below: go above
    setPosition({ left, top });
  }, []);

  const placeBelowTrigger = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) placeAt(rect.left + 16, rect.bottom - GAP + 6);
  };

  // A tap outside closes a hint opened by touch.
  React.useEffect(() => {
    if (!position) return;
    const close = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) setPosition(null);
    };
    const hide = () => setPosition(null);
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", hide);
    };
  }, [position]);

  return (
    <>
      <label htmlFor={htmlFor} className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-foreground", className)}>
        <span
          ref={triggerRef}
          tabIndex={0}
          aria-describedby={position ? hintId : undefined}
          className="inline-flex cursor-help items-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onMouseMove={(e) => placeAt(e.clientX, e.clientY)}
          onMouseLeave={() => setPosition(null)}
          onFocus={placeBelowTrigger}
          onBlur={() => setPosition(null)}
          onPointerDown={(e) => {
            if (e.pointerType !== "touch") return;
            e.preventDefault();
            if (position) setPosition(null);
            else placeAt(e.clientX, e.clientY);
          }}
        >
          {label}
          <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </span>
      </label>
      {position &&
        createPortal(
          <div
            ref={boxRef}
            id={hintId}
            role="tooltip"
            style={{ left: position.left, top: position.top, width: BOX_WIDTH }}
            className="pointer-events-none fixed z-50 rounded-xl border border-border bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg"
          >
            {hint}
          </div>,
          document.body
        )}
    </>
  );
}
