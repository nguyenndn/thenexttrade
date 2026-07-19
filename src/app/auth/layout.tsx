import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowLeft,
    BarChart3,
    Brain,
    TrendingUp,
    BookOpen,
    Target,
    Sparkles,
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
            title: "AI Journal & Analytics",
            description:
                "Log every trade with emotions, screenshots, and strategy tags. Get AI-powered pattern detection across your history.",
            icon: BarChart3,
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-500/10 border-emerald-500/20",
            stat: "6 dimensions",
            statLabel: "Trade scoring",
        },
        {
            title: "Psychology Bias Map",
            description:
                "AI scans your journal to identify cognitive biases — loss aversion, FOMO, overconfidence — so you can correct them.",
            icon: Brain,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-500/10 border-amber-500/20",
            stat: "4 bias axes",
            statLabel: "Radar analysis",
        },
        {
            title: "Trading Intelligence",
            description:
                "Weekly auto-generated reports with actionable insights, strategy performance breakdowns, and personalized recommendations.",
            icon: TrendingUp,
            color: "text-violet-600 dark:text-violet-400",
            bgColor: "bg-violet-500/10 border-violet-500/20",
            stat: "AI-powered",
            statLabel: "Weekly reports",
        },
    ];

    const bottomItems = [
        {
            icon: Target,
            label: "Edge Missions",
            color: "text-emerald-600 dark:text-emerald-400",
        },
        {
            icon: BookOpen,
            label: "Trading Academy",
            color: "text-amber-600 dark:text-amber-400",
        },
        {
            icon: Sparkles,
            label: "Leaderboard & Badges",
            color: "text-violet-600 dark:text-violet-400",
        },
    ];

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F4EC] text-slate-800 dark:bg-transparent dark:text-white p-4 font-outfit relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(25,52,81,0.46)_48%,rgba(6,69,79,0.38)_100%)]" />

            <div className="relative z-10 flex w-full max-w-7xl items-center justify-center gap-10 lg:justify-between lg:gap-10">
                {/* LEFT: Form Section */}
                <div className="w-full lg:w-[480px] shrink-0">
                    <div className="flex flex-row items-center justify-between gap-4 py-4">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-amber-900/5 backdrop-blur hover:border-amber-500/35 hover:text-slate-950 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-amber-300/35 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft
                                size={16}
                                className="transition-transform group-hover:-translate-x-1"
                            />
                            <span>Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <ThemeToggleSwitch />
                        </div>
                    </div>
                    {children}
                </div>

                {/* RIGHT: Premium Features Showcase (Hidden on mobile) */}
                <div className="hidden lg:flex flex-1 flex-col max-w-2xl">
                    {/* Hero copy */}
                    <div className="mb-10">
                        <h2 className="whitespace-nowrap text-[40px] font-black leading-[1.1] tracking-tight text-slate-950 dark:text-white">
                            Your Trading{" "}
                            <span className="bg-[linear-gradient(90deg,#B7791F,#F7C948,#10B981)] bg-clip-text text-transparent">
                                Command Center
                            </span>
                        </h2>
                        <p className="mt-4 whitespace-nowrap text-base leading-7 text-slate-500 dark:text-slate-400">
                            Journal, analyze, and improve — all in one
                            intelligent workspace designed for serious traders.
                        </p>
                    </div>

                    {/* Feature cards with connecting line */}
                    <div className="relative flex flex-col gap-0">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-400/40 via-amber-400/30 to-violet-400/40 dark:from-emerald-400/20 dark:via-amber-400/15 dark:to-violet-400/20" />

                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="relative flex gap-5 py-4 group"
                                >
                                    {/* Icon node */}
                                    <div
                                        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${feature.bgColor} transition-transform group-hover:scale-105`}
                                    >
                                        <Icon
                                            size={22}
                                            className={feature.color}
                                        />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                                {feature.title}
                                            </h3>
                                            <div className="text-right shrink-0">
                                                <p
                                                    className={`text-xs font-black ${feature.color}`}
                                                >
                                                    {feature.stat}
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                    {feature.statLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom: also included */}
                    <div className="mt-8 rounded-xl border border-dashboard/80 bg-white/60 backdrop-blur-sm p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                            Also included
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {bottomItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-2"
                                    >
                                        <Icon
                                            size={14}
                                            className={item.color}
                                        />
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {item.label}
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
