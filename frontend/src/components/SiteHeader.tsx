"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut, useSignedIn } from "@/lib/session";

export function Logo() {
  return (
    <span className="font-display text-lg font-semibold tracking-tight">
      Next<span className="text-accent">Path</span>
    </span>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const signedIn = useSignedIn();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="NextPath home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/signin" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
