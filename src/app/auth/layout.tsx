import { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    ArrowLeft,
    Activity,
    ShieldAlert,
    Target,
    Calculator,
    BookOpen,
    Crown,
} from "lucide-react";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";

export const metadata: Metadata = {
    title: {
        template: "%s | TheNextTrade",
        default: "Authentication | TheNextTrade",
    },
    description:
        "Sign in or create an account to access TheNextTrade tools, academy, and journal.",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const features = [
        {
            title: "Live MT5 Trade Telemetry",
            tag: "REAL-TIME SYNC",
            description:
                "Direct bridge from your MT5 terminal via Trade Manager EA. Every entry, stop-loss, slippage, and closed trade logged automatically with zero Excel typing.",
            icon: Activity,
            accentColor: "text-emerald-500",
            badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            iconBg: "border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/25 dark:bg-emerald-500/15",
            stat: "0 Manual Entry",
            statLabel: "Direct MT5 bridge",
        },
        {
            title: "Behavioral Tilt Radar",
            tag: "DRAWDOWN CONTROL",
            description:
                "Scans your execution patterns to detect revenge lot sizing, session FOMO, and off-plan trades before a single bad afternoon destroys weeks of disciplined gains.",
            icon: ShieldAlert,
            accentColor: "text-amber-500",
            badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
            iconBg: "border-amber-500/30 bg-amber-500/10 dark:border-amber-500/25 dark:bg-amber-500/15",
            stat: "Risk Telemetry",
            statLabel: "Loss spiral alerts",
        },
        {
            title: "10-Trade Sprint Coaching",
            tag: "ACCOUNTABILITY",
            description:
                "No motivational slogans. Receive one strict execution habit to fix across your next 10 trades, benchmarked directly against your historical data.",
            icon: Target,
            accentColor: "text-cyan-500",
            badgeBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300",
            iconBg: "border-cyan-500/30 bg-cyan-500/10 dark:border-cyan-500/25 dark:bg-cyan-500/15",
            stat: "1 Strict Goal",
            statLabel: "Weekly execution plan",
        },
    ];

    const bottomItems = [
        {
            icon: Calculator,
            label: "18 Risk Calculators",
            desc: "Position size & pip valuation",
            color: "text-emerald-600 dark:text-emerald-400",
        },
        {
            icon: BookOpen,
            label: "11-Level Academy",
            desc: "Market structure & liquidity",
            color: "text-amber-600 dark:text-amber-400",
        },
        {
            icon: Crown,
            label: "VIP Partner EAs",
            desc: "GoldScalperNinja & Phoenix",
            color: "text-cyan-600 dark:text-cyan-400",
        },
    ];

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#F7F4EC] text-slate-800 dark:bg-transparent dark:text-white px-4 py-6 sm:py-10 md:py-16 font-outfit relative overflow-x-hidden transition-colors duration-300">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(255,255,255,0.02)_40%,rgba(6,69,79,0.38)_100%)]" />

            <div className="relative z-10 flex w-full max-w-7xl items-center justify-center gap-10 lg:justify-between lg:gap-14">
                {/* LEFT: Form Section */}
                <div className="w-full max-w-[440px] sm:max-w-[480px] lg:max-w-none lg:w-[480px] shrink-0 mx-auto lg:mx-0">
                    <div className="flex flex-row items-center justify-between gap-4 py-4">
                        <Link
                            href="/"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "group rounded-full border-amber-900/10 bg-white/60 px-3.5 sm:px-4 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-semibold text-slate-600 shadow-sm shadow-amber-900/5 backdrop-blur hover:border-amber-500/35 hover:text-slate-950 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-amber-300/35 dark:hover:text-white shrink-0 inline-flex items-center gap-2",
                            })}
                        >
                            <ArrowLeft
                                size={16}
                                className="transition-transform group-hover:-translate-x-1"
                            />
                            <span>Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-4 shrink-0">
                            <ThemeToggleSwitch />
                        </div>
                    </div>
                    {children}
                </div>

                {/* RIGHT: Premium Features Showcase (Hidden on mobile) */}
                <div className="hidden lg:flex flex-1 flex-col max-w-2xl">
                    {/* Header */}
                    <div className="mb-7">
                        <h2 className="text-[34px] xl:text-[40px] font-black leading-[1.12] tracking-tight text-slate-950 dark:text-white">
                            Built for{" "}
                            <span className="bg-[linear-gradient(90deg,#B7791F,#F7C948,#10B981)] bg-clip-text text-transparent">
                                Execution Edge
                            </span>
                        </h2>
                        <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                            Stop repeating the same costly mistakes. Automated MT5 trade telemetry, behavioral tilt radar, and cold risk math — built to protect your equity curve.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="flex flex-col gap-3.5">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group relative rounded-2xl border border-amber-900/10 bg-white/75 p-4.5 sm:p-5 shadow-[0_4px_20px_rgba(88,64,27,0.04)] backdrop-blur-md transition-all duration-300 hover:border-amber-500/30 hover:bg-white/90 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon node */}
                                        <div
                                            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${feature.iconBg} transition-transform duration-300 group-hover:scale-105`}
                                        >
                                            <Icon
                                                size={20}
                                                className={feature.accentColor}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                                                        {feature.title}
                                                    </h3>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${feature.badgeBg}`}
                                                    >
                                                        {feature.tag}
                                                    </span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p
                                                        className={`text-xs font-black ${feature.accentColor}`}
                                                    >
                                                        {feature.stat}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                                        {feature.statLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom: Also included */}
                    <div className="mt-5 rounded-2xl border border-amber-900/10 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                Included with your workspace
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                100% Free
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {bottomItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex flex-col gap-0.5 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.03] p-2.5 transition-colors hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06]"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Icon
                                                size={14}
                                                className={item.color}
                                            />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {item.label}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            {item.desc}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
