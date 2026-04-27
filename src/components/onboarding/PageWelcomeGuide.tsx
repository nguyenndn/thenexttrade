"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================
// PAGE GUIDES — 1 card per page
// ============================
interface PageGuide {
    icon: string;
    title: string;
    description: string;
    tips: string[];
}

const pageGuides: Record<string, PageGuide> = {
    "/dashboard": {
        icon: "🏠",
        title: "Welcome to your Dashboard!",
        description: "Your trading command center — everything at a glance.",
        tips: [
            "Hero Stats show Balance, P&L, Win Rate & Trade Score",
            "Growth Chart tracks your cumulative net profit",
            "Use the sidebar to navigate between features",
        ],
    },
    "/dashboard/accounts": {
        icon: "💼",
        title: "Trading Accounts",
        description: "Connect and manage your MT5 trading accounts.",
        tips: [
            "Click 'Add Account' to connect a new MT5 account",
            "Download EA Sync to auto-send trades in real-time",
            "Each card shows account status, balance & heartbeat",
        ],
    },
    "/dashboard/journal": {
        icon: "📖",
        title: "Trading Journal",
        description: "Your complete trade history synced from MT5.",
        tips: [
            "Filter trades by date, symbol, account, and tags",
            "Click any trade to view details and add notes",
            "Use strategy tags to track which methods work best",
        ],
    },
    "/dashboard/strategies": {
        icon: "♟️",
        title: "Strategies",
        description: "Create strategies and track their performance.",
        tips: [
            "Create a strategy, then tag trades in the Journal",
            "Compare win rate and P&L across strategies",
        ],
    },
    "/dashboard/analytics": {
        icon: "📈",
        title: "Analytics Hub",
        description: "Deep dive into your trading performance.",
        tips: [
            "Equity curve, pair analysis & day-of-week patterns",
            "Switch tabs for Reports, Mistakes & Intelligence",
        ],
    },
    "/dashboard/reports": {
        icon: "📊",
        title: "Reports",
        description: "Detailed performance reports for your trading.",
        tips: [
            "Monthly and weekly breakdowns of your results",
            "Filter by account and date range for specifics",
        ],
    },
    "/dashboard/psychology": {
        icon: "🧠",
        title: "Psychology Tracker",
        description: "Track your emotional state and trading mindset.",
        tips: [
            "Log your emotions before and after trades",
            "Identify patterns between mindset and results",
        ],
    },
    "/dashboard/academy": {
        icon: "🎓",
        title: "Trading Academy",
        description: "Structured learning from beginner to advanced.",
        tips: [
            "Complete lessons sequentially to unlock the next",
            "Pass quizzes to earn certificates for each level",
        ],
    },
    "/dashboard/leaderboard": {
        icon: "🏆",
        title: "Leaderboard",
        description: "See how you rank against other traders.",
        tips: [
            "Rankings update based on performance metrics",
            "Climb the ranks by improving your consistency",
        ],
    },
    "/dashboard/settings": {
        icon: "⚙️",
        title: "Settings",
        description: "Customize your profile and preferences.",
        tips: [
            "Update your display name and avatar",
            "Configure notification and theme preferences",
        ],
    },
};

const STORAGE_PREFIX = "guide-seen-";

export function PageWelcomeGuide() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const guide = pageGuides[pathname];

    useEffect(() => {
        if (!guide) return;

        const key = STORAGE_PREFIX + pathname;
        const seen = localStorage.getItem(key);

        if (!seen) {
            const timer = setTimeout(() => {
                setVisible(true);
                setDismissed(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [pathname, guide]);

    const handleDismiss = () => {
        setDismissed(true);
        setTimeout(() => {
            setVisible(false);
            const key = STORAGE_PREFIX + pathname;
            localStorage.setItem(key, "true");
        }, 300);
    };

    if (!guide || !visible) return null;

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]",
                "transition-all duration-300 ease-out",
                dismissed
                    ? "opacity-0 translate-y-4 scale-95"
                    : "opacity-100 translate-y-0 scale-100"
            )}
        >
            <div className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
                {/* Gradient accent bar */}
                <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-teal-500" />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-xl">
                                {guide.icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                    {guide.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {guide.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 -mt-1 -mr-1"
                            aria-label="Dismiss guide"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="space-y-2 mb-4">
                        {guide.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                                <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                                <span className="leading-snug">{tip}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleDismiss}
                        className="w-full px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-emerald-500 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                    >
                        Got it! 👍
                    </button>
                </div>
            </div>
        </div>
    );
}
