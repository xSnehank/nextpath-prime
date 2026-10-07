import { Logo } from "@/components/SiteHeader";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <Logo />
        <span>DataQuest 3.0 · Problem DQNM</span>
      </div>
    </footer>
  );
}
