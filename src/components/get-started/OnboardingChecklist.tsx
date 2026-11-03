"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
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
    Trophy,
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
        description:
            "Add a username so your public profile, referrals, and leaderboard identity are clean.",
        href: "/dashboard/settings/profile",
        cta: "Edit profile",
        icon: User,
        completed: (progress) => progress.hasProfile,
    },
    {
        id: "account",
        title: "Connect an MT5 account",
        description:
            "Add the account number that Trade Manager EA will match against.",
        href: "/dashboard/accounts?action=add",
        cta: "Add account",
        icon: MonitorDown,
        completed: (progress) => progress.hasAccount,
    },
    {
        id: "sync",
        title: "Sync or log the first trade",
        description:
            "The dashboard becomes useful once at least one closed trade is available.",
        href: "/dashboard/accounts?setup=sync",
        cta: "Set up sync",
        icon: BarChart3,
        completed: (progress) => progress.hasFirstTrade,
    },
    {
        id: "review",
        title: "Open your review loop",
        description:
            "Use reports and journal notes to turn raw trades into one next action.",
        href: "/dashboard/reports",
        cta: "Open reports",
        icon: FileText,
        completed: (progress) => progress.totalTrades >= 10,
    },
    {
        id: "habit",
        title: "Track your rank & competition",
        description:
            "See your verified performance and compete on the live leaderboard.",
        href: "/dashboard/leaderboard",
        cta: "View leaderboard",
        icon: Trophy,
        completed: (progress) => progress.hasMissionComplete || progress.totalTrades >= 5,
    },
];

function getNextStep(progress: UserProgress) {
    return steps.find((step) => !step.completed(progress)) ?? null;
}

export function OnboardingChecklist({ progress }: { progress: UserProgress }) {
    const completedCount = steps.filter((step) =>
        step.completed(progress)
    ).length;
    const percentage = Math.round((completedCount / steps.length) * 100);
    const nextStep = getNextStep(progress);

    return (
        <div className="relative overflow-hidden bg-white px-4 pb-16 pt-28 text-gray-900 dark:bg-transparent dark:text-white sm:px-6 lg:px-8">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 mx-auto max-w-[1180px]">
                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold">
                            <Crown size={14} />
                            <span>Getting started</span>
                        </div>

                        <h1 className="text-3xl font-black font-heading tracking-tight sm:text-4xl">
                            Welcome
                            {progress.userName ? `, ${progress.userName}` : ""}.
                            Build your edge from the first trade.
                        </h1>
                        <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
                            This page shows the shortest path from account setup
                            to useful trading feedback. Keep moving until your
                            dashboard has real trade data.
                        </p>

                        <div className="mt-6 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-300">
                                    Launch progress
                                </span>
                                <span className="text-sm tabular-nums font-black text-amber-600 dark:text-gold">
                                    {percentage}%
                                </span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                <div
                                    className="h-full rounded-full bg-gold transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="mt-3 text-sm tabular-nums font-bold text-gray-700 dark:text-gray-200">
                                {completedCount} of {steps.length} steps
                                complete
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-3">
                                <div className="text-2xl tabular-nums font-black text-amber-600 dark:text-gold">
                                    {progress.totalAccounts}
                                </div>
                                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                                    Accounts
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-3">
                                <div className="text-2xl tabular-nums font-black text-amber-600 dark:text-gold">
                                    {progress.totalTrades}
                                </div>
                                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                                    Trades
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-3">
                                <div className="text-2xl tabular-nums font-black text-amber-600 dark:text-gold">
                                    Lv.{progress.level}
                                </div>
                                <div className="mt-1 text-[10px] tabular-nums font-black uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                                    {progress.xp} Edge
                                </div>
                            </div>
                        </div>

                        {nextStep ? (
                            <Link
                                href={nextStep.href}
                                className={cn(
                                    buttonVariants({
                                        variant: "gold",
                                        size: "smd",
                                    }),
                                    "mt-6 w-full rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold border-none"
                                )}
                            >
                                <span>{nextStep.cta}</span>
                                <ArrowRight size={16} className="ml-1" />
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard"
                                className={cn(
                                    buttonVariants({
                                        variant: "gold",
                                        size: "smd",
                                    }),
                                    "mt-6 w-full rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold border-none"
                                )}
                            >
                                <span>Go to dashboard</span>
                                <ArrowRight size={16} className="ml-1" />
                            </Link>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                                    <Compass size={17} className="text-gold" />
                                    <span>Your next actions</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                    Complete these in order. The first
                                    unfinished step is the one that matters
                                    most.
                                </p>
                            </div>
                            <Link
                                href="/dashboard/settings"
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "smd",
                                    }),
                                    "hidden sm:inline-flex border-gray-200 dark:border-white/10 hover:border-gold"
                                )}
                            >
                                <Settings size={14} className="mr-1" />
                                <span>Settings</span>
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
                                            "rounded-lg border p-4 transition-colors",
                                            done
                                                ? "border-gold/20 bg-gold/5 dark:border-gold/20 dark:bg-gold/10"
                                                : isNext
                                                  ? "border-gold/35 bg-white dark:bg-[#151925] shadow-xs"
                                                  : "border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925]",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={[
                                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                                                    done
                                                        ? "bg-gold text-white"
                                                        : "bg-white dark:bg-[#1E2028] text-amber-600 dark:text-gold border border-gold/20",
                                                ].join(" ")}
                                            >
                                                {done ? (
                                                    <CheckCircle2 size={21} />
                                                ) : (
                                                    <Icon size={21} />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                                        {step.title}
                                                    </h2>
                                                    {isNext && !done && (
                                                        <span className="rounded-lg bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                                                            Next
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm tabular-nums leading-6 text-gray-600 dark:text-gray-300">
                                                    {step.description}
                                                </p>
                                            </div>

                                            <div className="hidden shrink-0 sm:block">
                                                {done ? (
                                                    <Circle
                                                        size={18}
                                                        className="fill-gold text-gold"
                                                    />
                                                ) : (
                                                    <Link
                                                        href={step.href}
                                                        className={cn(
                                                            buttonVariants({
                                                                variant:
                                                                    "outline",
                                                                size: "smd",
                                                            }),
                                                            "border-gray-200 dark:border-white/10 hover:border-gold"
                                                        )}
                                                    >
                                                        {step.cta}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {!done && (
                                            <Link
                                                href={step.href}
                                                className={cn(
                                                    buttonVariants({
                                                        variant: "outline",
                                                        size: "smd",
                                                    }),
                                                    "mt-4 w-full sm:hidden border-gold/20 bg-gold/5 text-amber-700 dark:text-gold hover:bg-gold/10"
                                                )}
                                            >
                                                <span>{step.cta}</span>
                                                <ArrowRight
                                                    size={14}
                                                    className="ml-1"
                                                />
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 rounded-lg border border-gold/25 bg-gray-50/80 dark:bg-[#151925] p-4 text-gray-900 dark:text-white">
                            <div className="flex items-start gap-3">
                                <NotebookPen
                                    className="mt-0.5 text-amber-600 dark:text-gold shrink-0"
                                    size={20}
                                />
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                                        The goal is not setup. The goal is
                                        feedback.
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                        Once the first trade is in, use the
                                        dashboard and reports to decide what to
                                        repeat, what to stop, and what to
                                        improve tomorrow.
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
