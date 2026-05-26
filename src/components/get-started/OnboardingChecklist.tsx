"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Crown,
  FileText,
  MonitorDown,
  NotebookPen,
  Settings,
  Compass,
  Target,
  User,
} from "lucide-react";

export interface UserProgress {
  userName: string;
  hasProfile: boolean;
  hasAccount: boolean;
  hasFirstTrade: boolean;
  hasMissionComplete: boolean;
  totalAccounts: number;
  totalTrades: number;
  totalMissions: number;
  xp: number;
  level: number;
}

type StepDef = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  completed: (progress: UserProgress) => boolean;
};

const steps: StepDef[] = [
  {
    id: "profile",
    title: "Finish your identity",
    description: "Add a username so your public profile, referrals, and leaderboard identity are clean.",
    href: "/dashboard/settings/profile",
    cta: "Edit profile",
    icon: User,
    completed: (progress) => progress.hasProfile,
  },
  {
    id: "account",
    title: "Connect an MT5 account",
    description: "Add the account number that TNT Connect or EA Sync will match against.",
    href: "/dashboard/accounts?action=add",
    cta: "Add account",
    icon: MonitorDown,
    completed: (progress) => progress.hasAccount,
  },
  {
    id: "sync",
    title: "Sync or log the first trade",
    description: "The dashboard becomes useful once at least one closed trade is available.",
    href: "/dashboard/accounts?setup=sync",
    cta: "Set up sync",
    icon: BarChart3,
    completed: (progress) => progress.hasFirstTrade,
  },
  {
    id: "review",
    title: "Open your review loop",
    description: "Use reports and journal notes to turn raw trades into one next action.",
    href: "/dashboard/reports",
    cta: "Open reports",
    icon: FileText,
    completed: (progress) => progress.totalTrades >= 10,
  },
  {
    id: "habit",
    title: "Build the daily habit",
    description: "Daily check-in and missions keep the improvement loop visible.",
    href: "/dashboard/missions",
    cta: "View missions",
    icon: Target,
    completed: (progress) => progress.hasMissionComplete,
  },
];

function getNextStep(progress: UserProgress) {
  return steps.find((step) => !step.completed(progress)) ?? null;
}

export function OnboardingChecklist({ progress }: { progress: UserProgress }) {
  const completedCount = steps.filter((step) => step.completed(progress)).length;
  const percentage = Math.round((completedCount / steps.length) * 100);
  const nextStep = getNextStep(progress);

  return (
    <div className="relative overflow-hidden bg-[#F7F4EC] px-4 pb-16 pt-28 text-slate-950 dark:bg-[#090805] dark:text-white sm:px-6 lg:px-8">
      {/* Premium brand background exactly like /about */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(180,118,26,0.20)_0%,rgba(9,8,5,0.92)_42%,rgba(16,185,129,0.08)_100%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-gold/10 bg-white p-6 shadow-xl shadow-gold/5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-gold dark:bg-gold/10 dark:text-gold">
              <Crown size={14} />
              Getting started
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Welcome{progress.userName ? `, ${progress.userName}` : ""}. Build your edge from the first trade.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              This page shows the shortest path from account setup to useful trading feedback. Keep moving until your dashboard has real trade data.
            </p>

            <div className="mt-6 rounded-lg border border-gold/10 bg-gold/[0.02] p-4 dark:border-gold/10 dark:bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Launch progress</span>
                <span className="text-sm font-black text-gold">{percentage}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-gold/10 dark:bg-white/10 dark:ring-gold/20">
                <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-700" style={{ width: `${percentage}%` }} />
              </div>
              <div className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                {completedCount} of {steps.length} steps complete
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-2xl font-black text-gold">{progress.totalAccounts}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Accounts</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-2xl font-black text-gold">{progress.totalTrades}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Trades</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-2xl font-black text-gold">Lv.{progress.level}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{progress.xp} Edge</div>
              </div>
            </div>

            {nextStep ? (
              <Link
                href={nextStep.href}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-amber-500 text-white font-black px-5 py-3 text-sm shadow-xl shadow-gold/10 hover:from-amber-500 hover:to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                {nextStep.cta}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-amber-500 text-white font-black px-5 py-3 text-sm shadow-xl shadow-gold/10 hover:from-amber-500 hover:to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Go to dashboard
                <ArrowRight size={16} />
              </Link>
            )}
          </section>

          <section className="rounded-lg border border-gold/10 bg-white p-5 shadow-xl shadow-gold/5 dark:border-white/[0.06] dark:bg-white/[0.06]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                  <Compass size={17} className="text-gold" />
                  Your next actions
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Complete these in order. The first unfinished step is the one that matters most.</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="hidden min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:border-gold hover:bg-gold/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
              >
                <Settings size={14} />
                Settings
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const done = step.completed(progress);
                const isNext = nextStep?.id === step.id;

                return (
                  <div
                    key={step.id}
                    className={[
                      "rounded-lg border p-4 transition",
                      done
                        ? "border-gold/10 bg-gold/5 dark:border-gold/10 dark:bg-gold/10"
                        : isNext
                          ? "border-gold/30 bg-white shadow-md shadow-gold/5 dark:border-gold/20 dark:bg-white/[0.08]"
                          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                        done ? "bg-gold text-white" : "bg-white text-gold ring-1 ring-gold/20 dark:bg-white/10 dark:ring-gold/20",
                      ].join(" ")}>
                        {done ? <CheckCircle2 size={21} /> : <Icon size={21} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-black text-slate-950 dark:text-white">{step.title}</h2>
                          {isNext && !done && (
                            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                              Next
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                      </div>

                      <div className="hidden shrink-0 sm:block">
                        {done ? (
                          <Circle size={18} className="fill-gold text-gold" />
                        ) : (
                          <Link href={step.href} className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-gold hover:bg-gold/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                            {step.cta}
                          </Link>
                        )}
                      </div>
                    </div>

                    {!done && (
                      <Link href={step.href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-gold/20 bg-gold/5 text-xs font-black text-gold transition hover:bg-gold/10 dark:border-gold/20 dark:bg-gold/10 dark:text-gold sm:hidden">
                        {step.cta}
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-gold/30 bg-gradient-to-br from-amber-500/[0.06] to-gold/[0.03] dark:from-gold/[0.04] dark:to-transparent dark:bg-[#0E1118] p-4 text-slate-950 dark:text-white shadow-md shadow-gold/5 dark:shadow-none">
              <div className="flex items-start gap-3">
                <NotebookPen className="mt-0.5 text-gold" size={20} />
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">The goal is not setup. The goal is feedback.</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-amber-50/80">
                    Once the first trade is in, use the dashboard and reports to decide what to repeat, what to stop, and what to improve tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
