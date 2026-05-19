import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardHeroProps {
    totalBalance: number;
    periodPnL: number;
    winRate: number;
    tradeScore: number | null;
    isDark: boolean;
}

function getScoreColor(score: number) {
    if (score >= 80) return "hsl(160, 84%, 39%)";    // emerald
    if (score >= 60) return "hsl(var(--primary))";     // primary
    if (score >= 40) return "hsl(38, 92%, 50%)";       // amber
    return "hsl(0, 72%, 51%)";                         // red
}

function MetricTooltip({ content }: { content: string }) {
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        aria-label="Explain this metric"
                    >
                        <HelpCircle size={13} />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-[270px] bg-gray-950 px-3 py-2 text-xs leading-relaxed text-white shadow-xl dark:bg-white dark:text-gray-950"
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function DashboardHero({ totalBalance, periodPnL, winRate, tradeScore, isDark }: DashboardHeroProps) {
    const scoreColor = tradeScore !== null ? getScoreColor(tradeScore) : "transparent";

    return (
        <div id="onborda-hero" className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-[#0B0E14] dark:to-[#131720] border border-gray-200 dark:border-white/10 p-4 sm:p-6 shadow-lg">
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Balance */}
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">Total Balance</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Live + Funded</p>
                </div>

                {/* Period P&L */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">Period P&L</p>
                    <div className="flex items-center justify-center gap-2">
                        {periodPnL >= 0
                            ? <TrendingUp size={20} className="text-primary" />
                            : <TrendingDown size={20} className="text-red-500" />
                        }
                        <p className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${
                            periodPnL >= 0 ? 'text-primary' : 'text-red-500'
                        }`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(periodPnL)}
                        </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Realized P&L</p>
                </div>

                {/* Win Rate */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <div className="mb-1.5 flex items-center justify-center gap-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Win Rate</p>
                        <MetricTooltip content="Winning trades divided by decisive trades. Break-even trades are excluded from the denominator, so profit + BE with no losses shows 100%." />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="4" fill="none" />
                                <circle
                                    cx="28" cy="28" r="24"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(winRate / 100) * 150.8} 150.8`}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 dark:text-white">
                                {winRate.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Winning trades</p>
                </div>

                {/* Trade Score */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <div className="mb-1.5 flex items-center justify-center gap-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Trade Score</p>
                        <MetricTooltip content="A 0-100 discipline score based on win rate, risk:reward, plan compliance, stop-loss discipline, revenge trading, weak pairs, and emotion patterns." />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="4" fill="none" />
                                {tradeScore !== null && (
                                    <circle
                                        cx="28" cy="28" r="24"
                                        stroke={scoreColor}
                                        strokeWidth="4"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(tradeScore / 100) * 150.8} 150.8`}
                                    />
                                )}
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 dark:text-white">
                                {tradeScore !== null ? tradeScore : "--"}
                            </span>
                        </div>
                    </div>
                    <Link href="/dashboard/intelligence" className="text-xs text-gray-600 dark:text-gray-300 mt-1 hover:text-primary transition-colors inline-block">
                        {tradeScore !== null ? "View Details →" : "Need 30+ trades"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
