import Link from "next/link";
import { ArrowRight, ClipboardList, Lock, Users, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Student",
    text: "Take a short assessment of your strengths and interests, then invite your parent.",
  },
  {
    icon: Wallet,
    title: "Parent",
    text: "Join with the invite code and add your budget, savings and the fields you hope for.",
  },
  {
    icon: Users,
    title: "Together",
    text: "See the top careers you can afford, with exams, colleges and scholarships.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <section className="py-16 sm:py-24 text-center">
        <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          DataQuest 3.0
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          A career plan the whole family agrees on
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Your strengths, your family&apos;s budget and real job-market data, combined into one ranked, affordable plan.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            I&apos;m a student <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/parent/join" className={buttonVariants({ variant: "outline", size: "lg" })}>
            I&apos;m a parent
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      <section className="pb-16 sm:pb-24">
        <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <Icon className="h-4 w-4 text-accent" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          Your answers stay private. You see the comparison only after you both agree.
        </p>
      </section>
    </div>
  );
}
