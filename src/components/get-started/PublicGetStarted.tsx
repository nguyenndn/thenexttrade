"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    CircleHelp,
    Crown,
    Download,
    LineChart,
    NotebookPen,
    ShieldCheck,
    Target,
} from "lucide-react";

const launchSteps = [
    {
        label: "Create workspace",
        title: "Initialize Your Free Account",
        description:
            "Create your secure workspace in seconds, select your username, and keep your profile lightweight.",
        icon: ShieldCheck,
    },
    {
        label: "Bring trades in",
        title: "Link Trade Manager EA",
        description:
            "Deploy our lightweight Expert Advisor on your MT5 terminal to sync execution history in real-time.",
        icon: Download,
    },
    {
        label: "Review the data",
        title: "Extract Your Real Performance",
        description:
            "Uncover patterns in your win rate, drawdown, sessions, and behavior without manual calculations.",
        icon: BarChart3,
    },
    {
        label: "Improve daily",
        title: "Gamify Your Trading Discipline",
        description:
            "Turn metrics into habits. Use missions, rule checklists, and bias tracking to eliminate costly errors.",
        icon: NotebookPen,
    },
];

const valueCards = [
    {
        title: "100% Automated Sync",
        description:
            "Forget tedious Excel sheets. The moment you close a position on MT5, it is instantly analyzed.",
        icon: LineChart,
    },
    {
        title: "Psychology & Bias Logs",
        description:
            "Track your emotions. Detect revenge trading, FOMO, and loss aversion patterns automatically.",
        icon: CircleHelp,
    },
    {
        title: "Edge instead of noise",
        description:
            "This shows which of your habits cost you money, so you can fix it before your next trade.",
        icon: Target,
    },
];

export function PublicGetStarted() {
    return (
        <div className="relative overflow-hidden bg-white text-gray-900 dark:bg-transparent dark:text-white">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <section className="relative z-10 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1180px]">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold shadow-xs">
                            <Crown size={14} />
                            <span>Start here</span>
                        </div>

                        <h1 className="text-4xl font-black font-heading tracking-tight sm:text-5xl md:text-6xl">
                            Your Trading Edge,{" "}
                            <span className="text-gold">Fully Automated.</span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base tabular-nums font-medium leading-8 text-gray-600 dark:text-gray-300 sm:text-lg">
                            Connect your MT5 terminal in 60 seconds. Stop
                            wasting time on manual spreadsheets, and start
                            tracking your real execution edge.
                        </p>

                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link
                                href="/auth/signup?source=get_started"
                                className={cn(
                                    buttonVariants({
                                        variant: "gold",
                                        size: "smd",
                                    }),
                                    "w-full sm:w-auto rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold border-none"
                                )}
                            >
                                <span>Open Free Workspace</span>
                                <ArrowRight size={16} className="ml-1" />
                            </Link>
                            <Link
                                href="/auth/login"
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "smd",
                                    }),
                                    "w-full sm:w-auto rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] hover:border-gold"
                                )}
                            >
                                I already have an account
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-4 lg:grid-cols-4">
                        {launchSteps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.title}
                                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm transition-all duration-200 hover:border-amber-500/35 dark:hover:border-gold/30 hover:shadow-md"
                                >
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-amber-600 dark:text-gold border border-gold/20">
                                            <Icon size={20} />
                                        </div>
                                        <span className="text-xs tabular-nums font-black text-amber-600 dark:text-gold">
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold">
                                        {step.label}
                                    </div>
                                    <h2 className="mt-2 text-lg font-black text-gray-900 dark:text-white">
                                        {step.title}
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-white shrink-0">
                                    <ClipboardCheck size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                        What happens after signup?
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        You will be guided into the exact next
                                        step.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                {valueCards.map((card) => {
                                    const Icon = card.icon;
                                    return (
                                        <div
                                            key={card.title}
                                            className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4"
                                        >
                                            <Icon
                                                className="text-amber-600 dark:text-gold"
                                                size={20}
                                            />
                                            <h3 className="mt-4 text-sm tabular-nums font-black text-gray-900 dark:text-white">
                                                {card.title}
                                            </h3>
                                            <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                                {card.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gold/30 bg-white dark:bg-[#1E2028] p-6 text-gray-900 dark:text-white shadow-sm">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">
                                Recommended path
                            </div>
                            <h2 className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
                                Trade Manager EA.
                            </h2>
                            <p className="mt-3 text-sm tabular-nums leading-7 text-gray-600 dark:text-gray-300">
                                The easiest, safest way to link MetaTrader 5. It
                                runs quietly on your chart or VPS, pushing
                                closed positions to your secure dashboard in
                                real time.
                            </p>
                            <div className="mt-6 space-y-3">
                                {[
                                    "Create secure account",
                                    "Add MT5 account number",
                                    "Generate Sync API key",
                                    "Deploy the EA & sync instantly",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-3 text-sm tabular-nums font-bold text-gray-800 dark:text-white"
                                    >
                                        <CheckCircle2
                                            size={17}
                                            className="text-amber-500 dark:text-gold shrink-0"
                                        />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/auth/signup?source=get_started"
                                className={cn(
                                    buttonVariants({
                                        variant: "gold",
                                        size: "smd",
                                    }),
                                    "mt-7 w-full rounded-lg bg-gold hover:bg-amber-600 !text-white border-none font-bold"
                                )}
                            >
                                <span>Start Workspace Setup</span>
                                <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
