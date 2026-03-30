import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

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

export function DashboardHero({ totalBalance, periodPnL, winRate, tradeScore, isDark }: DashboardHeroProps) {
    const scoreColor = tradeScore !== null ? getScoreColor(tradeScore) : "transparent";

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-[#0B0E14] dark:to-[#131720] border border-gray-200 dark:border-white/10 p-6 shadow-lg">
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Balance */}
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Total Balance</p>
                    <p className="text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Live + Funded</p>
                </div>

                {/* Period P&L */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Period P&L</p>
                    <div className="flex items-center justify-center gap-2">
                        {periodPnL >= 0
                            ? <TrendingUp size={20} className="text-primary" />
                            : <TrendingDown size={20} className="text-red-500" />
                        }
                        <p className={`text-2xl lg:text-3xl font-black tracking-tight ${
                            periodPnL >= 0 ? 'text-primary' : 'text-red-500'
                        }`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(periodPnL)}
                        </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Realized P&L</p>
                </div>

                {/* Win Rate */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Win Rate</p>
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
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">
                                {winRate.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Winning trades</p>
                </div>

                {/* Trade Score */}
                <div className="text-center border-l-0 lg:border-l border-gray-200 dark:border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Trade Score</p>
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
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">
                                {tradeScore !== null ? tradeScore : "--"}
                            </span>
                        </div>
                    </div>
                    <Link href="/dashboard/intelligence" className="text-xs text-gray-400 dark:text-gray-500 mt-1 hover:text-primary transition-colors inline-block">
                        {tradeScore !== null ? "View Details →" : "Need 30+ trades"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
