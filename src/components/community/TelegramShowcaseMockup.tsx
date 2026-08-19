"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    CheckCircle2,
    Shield,
    BookOpen,
    Copy,
    Check,
    Brain,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { motion, AnimatePresence } from "framer-motion";

interface TelegramShowcaseMockupProps {
    telegramUrl: string;
}

type TabType = "psych" | "mindset" | "tips";

interface TabPost {
    title: string;
    body: string;
    footerLeft: string;
    footerRight: string;
}

// ══════════════════════════════════════════════════════════════════════
// TAB 1: 10 CURATED TRADING PSYCHOLOGY POSTS (Rotates randomly on load)
// ══════════════════════════════════════════════════════════════════════
const PSYCH_POSTS: TabPost[] = [
    {
        title: "Your Edge Is Boring:",
        body: "Markets reward boring consistency, not heroics. The same level, same trigger, same stop, same size, every time. Let the statistics work over dozens of trades — that is what makes a strategy real.",
        footerLeft: "Boring Beats Heroics",
        footerRight: "Consistency Wins",
    },
    {
        title: "FOMO Is a Fee:",
        body: "You never miss a trade — you miss setups that do not match your plan. The panic to enter after a big move is the most expensive impulse a gold trader can have. If it moved without you, let it go; the market will offer the same setup again.",
        footerLeft: "No FOMO",
        footerRight: "Patience Compounds",
    },
    {
        title: "Your Edge Dies on Tilt:",
        body: "One angry trade can erase a week of discipline. When you catch yourself averaging into a loss or revenge-sizing, step away from the chart for 30 minutes. Protect your mental capital as carefully as your money.",
        footerLeft: "Protect Mental Capital",
        footerRight: "Stop Before Tilt",
    },
    {
        title: "Losses Are Tuition:",
        body: "Every losing trade carries a lesson — but only if you journal it. Write what you missed, not just what you lost. The trader who reviews losses weekly turns mistakes into an edge others pay for.",
        footerLeft: "Losses = Tuition",
        footerRight: "Journal Every Loss",
    },
    {
        title: "Redefine Winning:",
        body: "A winning trade can still be a bad trade, and a losing trade can be perfect. Judge yourself on process — did you follow the plan, size correctly, and manage the stop? Results follow process, not the other way around.",
        footerLeft: "Process Over Result",
        footerRight: "Judge the Plan",
    },
    {
        title: "Pause After a Win:",
        body: "After a big winning session, confidence runs hot and judgment runs thin. Traders give back profits in the next three trades more often than they realize. Take the win, close the screen, and reset before the next session.",
        footerLeft: "Bank the Win",
        footerRight: "Reset Before Next",
    },
    {
        title: "Boredom Breaks Discipline:",
        body: "When there is no clean setup, the temptation is to trade something just to feel busy. Idle hands lose money. No trade is a position — it is the professional default when structure is unclear.",
        footerLeft: "No Trade Is a Position",
        footerRight: "Skip the Noise",
    },
    {
        title: "Attachment Breeds Denial:",
        body: "The moment you fall in love with a bias, you stop seeing the chart. The market owes your analysis nothing. When price invalidates your level, accept the outcome instantly without arguing with candles.",
        footerLeft: "Zero Bias Attachment",
        footerRight: "Respect Invalidation",
    },
    {
        title: "The Urge to Break Even:",
        body: "Moving your stop to breakeven too early chokes winning trades before they develop. Give the setup breathing room based on market structure, not your fear of giving back unrealized pips.",
        footerLeft: "Let Winners Breathe",
        footerRight: "Structure Over Fear",
    },
    {
        title: "Trade Who You Are:",
        body: "Copying someone else's scalping tempo when your temperament suits swing trading will cause endless friction. Find the timeframe and setup frequency that lets you sleep at night.",
        footerLeft: "Know Your Temperament",
        footerRight: "Trade With Ease",
    },
];

// ══════════════════════════════════════════════════════════════════════
// TAB 2: 10 ESSENTIAL RISK MANAGEMENT RULES (Rotates randomly on load)
// ══════════════════════════════════════════════════════════════════════
const MINDSET_POSTS: TabPost[] = [
    {
        title: "Rule #1 for Gold Traders:",
        body: "Never enter a trade without a pre-defined stop loss. Keep risk capped at 1-2% per position so high-volatility XAUUSD sessions do not damage the account. Skip any setup where the stop is wider than your planned risk — capital preservation before every entry.",
        footerLeft: "1-2% Risk Cap",
        footerRight: "Capital Protection First",
    },
    {
        title: "Rule #2 — Trade the Plan:",
        body: "A trade without a written edge is just a gamble with extra steps. Only take setups that match your plan — when the market does not offer your level, doing nothing is a completely valid position.",
        footerLeft: "Trade the Plan",
        footerRight: "Patience Is Profit",
    },
    {
        title: "Rule #3 — No Revenge Trading:",
        body: "A single losing XAUUSD trade tells you nothing about the next one. After a loss, close the screen, review your journal, and wait for a fresh high-confluence setup. Revenge is how accounts die.",
        footerLeft: "No Revenge",
        footerRight: "Discipline Over Emotion",
    },
    {
        title: "Rule #4 — Consistent Risk Sizing:",
        body: "Size every position so the stop loss hurts the same whether it is your first loss or your fifth. Consistent risk is what keeps a losing streak survivable and a winning streak meaningful.",
        footerLeft: "Consistent Risk",
        footerRight: "Survive to Compound",
    },
    {
        title: "Rule #5 — The Stop Is Sacred:",
        body: "Never move a stop loss against your original plan. Widening the stop to give a trade more room is how a small, controlled loss becomes a margin call. Take the loss and move on.",
        footerLeft: "SL Is Sacred",
        footerRight: "Cut Losses Fast",
    },
    {
        title: "Rule #6 — Quality Over Quantity:",
        body: "Trade when the setup is present, not when the clock says so. Forcing entries during quiet Asian hours or before major news adds noise instead of edge. If the structure is not clean, skip the session.",
        footerLeft: "Quality Over Quantity",
        footerRight: "No Setup, No Trade",
    },
    {
        title: "Rule #7 — Review Every Week:",
        body: "Review every losing trade in your journal before the next session and write down what you missed — emotion, timing, or structure. The trader who reviews weekly compounds monthly.",
        footerLeft: "Weekly Review",
        footerRight: "Learn From Losses",
    },
    {
        title: "Rule #8 — Daily Circuit Breaker:",
        body: "Set a hard daily loss limit of 3-4%. If hit, the trading day is officially over — no exceptions, no 'one last quick scalp'. Circuit breakers prevent bad days from becoming catastrophic weeks.",
        footerLeft: "Daily Circuit Breaker",
        footerRight: "Protect Downside",
    },
    {
        title: "Rule #9 — Never Add to Losers:",
        body: "Averaging down into a losing position turns a small mistake into account suicide. If your entry was wrong, adding more lots only accelerates the drawdown. Cut it and wait for a clean re-entry.",
        footerLeft: "No Averaging Down",
        footerRight: "Preserve Equity",
    },
    {
        title: "Rule #10 — Risk Capital Only:",
        body: "Never trade with rent, savings, or emergency funds. Scared money cannot execute disciplined trading. Only trade with capital you can afford to hold through standard drawdowns.",
        footerLeft: "Risk Capital Only",
        footerRight: "Trade Stress-Free",
    },
];

// ══════════════════════════════════════════════════════════════════════
// TAB 3: 10 S&D & PRICE ACTION TIPS (Rotates randomly on load)
// ══════════════════════════════════════════════════════════════════════
const TIPS_POSTS: TabPost[] = [
    {
        title: "Supply & Demand Zones:",
        body: "Mark the last supply zone gold rejected from before a drop — and the demand zone that rejected before a rally. Gold respects these levels more than most indicators, so wait for a clean retest of the zone instead of entering mid-range.",
        footerLeft: "Supply & Demand Zones",
        footerRight: "Levels Gold Respects",
    },
    {
        title: "Zone Sweep + Retest:",
        body: "When gold sweeps the low of a demand zone and quickly closes back inside it, that is a liquidity sweep. The first retest of the zone after the sweep is often the highest-probability long of the session.",
        footerLeft: "Zone Sweep + Retest",
        footerRight: "High Probability Entry",
    },
    {
        title: "Rejection Candle Confirmation:",
        body: "A single strong rejection candle — a pin bar, an engulfing candle, or a close far off the wick — inside a supply or demand zone is your trigger. Never enter a zone on price alone; wait for the candle to confirm.",
        footerLeft: "Rejection Candle",
        footerRight: "Wait for Confirmation",
    },
    {
        title: "Break of Structure (BoS):",
        body: "Let gold take out the prior high or low and close beyond it. A clean break of structure confirms momentum has shifted — enter on the retest of the broken level, not on the break itself, for a tighter stop.",
        footerLeft: "Break of Structure",
        footerRight: "Trade the Retest",
    },
    {
        title: "Asian Range Break:",
        body: "Gold loves to trade the Asian range break. Let price sweep one side of the Asian high or low, then look for the M5 break-and-retest into the London open — clean entries, tight stops.",
        footerLeft: "Asian Range Break",
        footerRight: "London Open Bias",
    },
    {
        title: "Fresh Zones Over Old Ones:",
        body: "The first touch of a fresh supply or demand zone is the strongest. Once price has bounced off a zone two or three times, the level gets used up — skip the late retests unless a strong candle confirms it.",
        footerLeft: "Fresh Zone Priority",
        footerRight: "Old Zones Weaken",
    },
    {
        title: "Minimum 1:2 Reward-to-Risk:",
        body: "For XAUUSD scalps, only take setups offering at least 1:2 reward-to-risk. If your stop needs to be 15 points for a 10-point target, the setup is not worth the volatility. Walk away.",
        footerLeft: "Min 1:2 R:R",
        footerRight: "Only High Odds",
    },
    {
        title: "Fair Value Gap (FVG) Confluence:",
        body: "When an impulsive breakout leaves an unfilled Fair Value Gap inside your demand zone, price frequently retraces into that imbalance before continuing the trend. Use FVGs as high-precision entry triggers.",
        footerLeft: "FVG Imbalance",
        footerRight: "Precision Entry",
    },
    {
        title: "High-Impact News Protocol:",
        body: "Never enter right before NFP, CPI, or FOMC. Let the initial knee-jerk spike sweep institutional liquidity. Enter on the subsequent M15 structure confirmation once spread normalizes.",
        footerLeft: "News Protocol",
        footerRight: "Trade After the Spike",
    },
    {
        title: "Multi-Timeframe Alignment:",
        body: "Determine your trend bias on H4/H1, find your key zone on M15, and execute your trigger on M5/M1. Trading with higher-timeframe order flow drastically increases setup win rate.",
        footerLeft: "Multi-Timeframe Sync",
        footerRight: "Trade With Higher Trend",
    },
];

export function TelegramShowcaseMockup({
    telegramUrl,
}: TelegramShowcaseMockupProps) {
    const [activeTab, setActiveTab] = useState<TabType>("psych");
    const [copied, setCopied] = useState(false);
    const [visitorId, setVisitorId] = useState<string>("");
    const [reactions, setReactions] = useState({
        flame: 492,
        rocket: 312,
        heart: 218,
        hundred: 185,
        handshake: 142,
    });
    const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});

    // Deterministic default on initial render (SSR-safe), randomized on mount
    const [selectedIndices, setSelectedIndices] = useState({
        psych: 0,
        mindset: 0,
        tips: 0,
    });

    const psychPost = PSYCH_POSTS[selectedIndices.psych] || PSYCH_POSTS[0];
    const mindsetPost = MINDSET_POSTS[selectedIndices.mindset] || MINDSET_POSTS[0];
    const tipsPost = TIPS_POSTS[selectedIndices.tips] || TIPS_POSTS[0];

    // Initialize Visitor ID, live reactions, & randomize posts on each page load/refresh
    useEffect(() => {
        // Randomize on every page load/refresh
        setSelectedIndices({
            psych: Math.floor(Math.random() * PSYCH_POSTS.length),
            mindset: Math.floor(Math.random() * MINDSET_POSTS.length),
            tips: Math.floor(Math.random() * TIPS_POSTS.length),
        });

        let storedId = localStorage.getItem("gsn_visitor_id");
        if (!storedId) {
            storedId = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
            localStorage.setItem("gsn_visitor_id", storedId);
        }
        setVisitorId(storedId);

        // Fetch live server reactions
        fetch(`/api/community/reactions?visitorId=${encodeURIComponent(storedId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.success) {
                    setReactions(data.reactions);
                    setUserReacted(data.userReacted);
                }
            })
            .catch(() => {
                // Fallback to local storage if API is unreachable
                const savedUserReacted = localStorage.getItem("gsn_user_reactions");
                if (savedUserReacted) {
                    try {
                        setUserReacted(JSON.parse(savedUserReacted));
                    } catch {}
                }
            });
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(telegramUrl);
        setCopied(true);
        toast.success("Copied channel invite link");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReaction = async (key: keyof typeof reactions) => {
        const isReacted = userReacted[key];
        
        // Optimistic UI update for instant feedback
        setReactions((prev) => ({
            ...prev,
            [key]: isReacted ? Math.max(0, prev[key] - 1) : prev[key] + 1,
        }));
        const newReactedState = {
            ...userReacted,
            [key]: !isReacted,
        };
        setUserReacted(newReactedState);
        localStorage.setItem("gsn_user_reactions", JSON.stringify(newReactedState));

        // Sync with Live API server
        try {
            const res = await fetch("/api/community/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, visitorId }),
            });
            const data = await res.json();
            if (data.success) {
                setReactions(data.reactions);
                setUserReacted(data.userReacted);
            }
        } catch {
            // Keep optimistic update on network error
        }
    };

    return (
        <div className="relative w-full">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400/20 via-[#2AABEE]/20 to-amber-500/20 blur-2xl opacity-70 pointer-events-none" />

            {/* Flowing laser border — same implementation as the "Looking for Automated Execution?" block on the home page */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @keyframes border-flow-teaser-new {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -360; }
        }
        .animate-flow-teaser-new {
          stroke-dasharray: 120 240;
          animation: border-flow-teaser-new 12s linear infinite;
        }
      `,
                }}
            />
            {/* Console LED Neon Running Border */}
            <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_25px_60px_rgba(15,23,42,0.4)]">
                {/* Responsive flowing laser border */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl">
                    <defs>
                        <linearGradient
                            id="laser-grad-telegram-teaser"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                stopColor="#f59e0b"
                                stopOpacity="0.1"
                            />
                            <stop
                                offset="50%"
                                stopColor="#f59e0b"
                                stopOpacity="0.75"
                            />
                            <stop
                                offset="100%"
                                stopColor="#10b981"
                                stopOpacity="0.15"
                            />
                        </linearGradient>
                    </defs>
                    <rect
                        x="0.5"
                        y="0.5"
                        width="calc(100% - 1px)"
                        height="calc(100% - 1px)"
                        rx="23"
                        fill="none"
                        stroke="url(#laser-grad-telegram-teaser)"
                        strokeWidth="1.5"
                        className="animate-flow-teaser-new"
                    />
                </svg>
                <div className="relative rounded-3xl border border-amber-200/50 dark:border-white/10 bg-white/95 dark:bg-[#0E1621] text-gray-800 dark:text-white backdrop-blur-xl overflow-hidden flex flex-col">
                {/* Telegram Window Top Header */}
                <div className="bg-slate-100/90 dark:bg-[#17212B] px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-sky-500 shadow-sm">
                                <Image
                                    src="/images/logo_ninja.png"
                                    alt="GoldScalperNinja Logo"
                                    width={40}
                                    height={40}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#17212B]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-sm text-gray-900 dark:text-white">
                                    GoldScalperNinja Official
                                </span>
                                <CheckCircle2 size={15} className="text-[#2AABEE] fill-[#2AABEE]" />
                            </div>
                            <span className="text-[11px] text-[#2AABEE] font-semibold">
                                12,000+ subscribers - GoldScalperNinja
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            title="Copy Telegram Channel Link"
                            aria-label="Copy Telegram channel invite link"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/[0.16] transition-all active:scale-95"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span className="hidden sm:inline">Copy Link</span>
                        </button>
                    </div>
                </div>

                {/* 3 Interactive Showcase Tabs with Framer Motion Smooth Sliding Active Pill */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} tabsId="telegramShowcase">
                    <TabsList className="w-full grid grid-cols-3 bg-slate-100 dark:bg-[#17212B] border-b border-slate-200 dark:border-white/10 p-1.5 gap-1.5 rounded-none border-t-0 border-x-0">
                        <TabsTrigger
                            value="psych"
                            className="w-full justify-center py-2 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <Brain size={14} className="shrink-0" />
                            <span className="truncate">Psychology</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="mindset"
                            className="w-full justify-center py-2 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <Shield size={14} className="shrink-0" />
                            <span className="truncate">Risk Rules</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="tips"
                            className="w-full justify-center py-2 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <BookOpen size={14} className="shrink-0" />
                            <span className="truncate">S&D + PA Tips</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Telegram Active Stream Content with AnimatePresence Smooth Fade/Slide */}
                <div className="p-3.5 sm:p-4 space-y-3 bg-slate-50/70 dark:bg-[#0E1621] flex flex-col">
                    <AnimatePresence mode="wait">
                        {/* TAB 1: Trading Psychology Tip */}
                        {activeTab === "psych" && (
                            <motion.div
                                key="psych"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="min-h-[214px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-violet-500/10 dark:from-violet-500/15 dark:to-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-violet-700 dark:text-violet-300">
                                    <span className="flex items-center gap-1.5">
                                        <Brain size={13} className="text-violet-500" /> TRADING PSYCHOLOGY
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] font-black">
                                        Mindset Shift
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    <strong>{psychPost.title}</strong> {psychPost.body}
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-violet-200/60 dark:border-white/10">
                                    <span>Core Insight: <strong className="text-violet-600 dark:text-violet-400 font-bold">{psychPost.footerLeft}</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">{psychPost.footerRight}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: Trader Discipline & Risk Management */}
                        {activeTab === "mindset" && (
                            <motion.div
                                key="mindset"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="min-h-[214px] bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-sky-500/10 dark:from-sky-500/15 dark:to-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                                    <span className="flex items-center gap-1.5">
                                        <Shield size={13} className="text-[#2AABEE]" /> RISK MANAGEMENT RULE
                                    </span>
                                    <span className="text-xs font-bold text-[#2AABEE]">Capital Protection</span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    <strong>{mindsetPost.title}</strong> {mindsetPost.body}
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-sky-200/60 dark:border-white/10">
                                    <span>Core Value: <strong className="text-sky-600 dark:text-sky-400 font-bold">{mindsetPost.footerLeft}</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">{mindsetPost.footerRight}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: Supply & Demand + Price Action Tip */}
                        {activeTab === "tips" && (
                            <motion.div
                                key="tips"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="min-h-[214px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-500/15 dark:to-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen size={13} className="text-emerald-500" /> S&D + PRICE ACTION TIP
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Execution Edge</span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    <strong>{tipsPost.title}</strong> {tipsPost.body}
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-emerald-200/60 dark:border-white/10">
                                    <span>Setup Type: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{tipsPost.footerLeft}</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">{tipsPost.footerRight}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Live Community Reactions Bar */}
                <div className="px-4 py-3 bg-white dark:bg-[#17212B] border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold text-[11px]">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LIVE REACTIONS</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {(
                            [
                                { key: "flame", emoji: "🔥", count: reactions.flame },
                                { key: "rocket", emoji: "🚀", count: reactions.rocket },
                                { key: "heart", emoji: "❤️", count: reactions.heart },
                                { key: "hundred", emoji: "💯", count: reactions.hundred },
                                { key: "handshake", emoji: "🤝", count: reactions.handshake },
                            ] as const
                        ).map((r) => {
                            const isSelected = userReacted[r.key];
                            return (
                                <button
                                    key={r.key}
                                    type="button"
                                    onClick={() => handleReaction(r.key)}
                                    aria-label={`React with ${r.emoji}`}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all transform active:scale-90 ${
                                        isSelected
                                            ? "bg-[#2AABEE]/20 border border-[#2AABEE] text-[#2AABEE] scale-105 shadow-xs"
                                            : "bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <span>{r.emoji}</span>
                                    <span className="font-mono">{r.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                </div>
            </div>

            {/* Subtext Footer */}
            <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
                Join GoldScalperNinja - 100% Free - Live daily analysis every morning
            </p>
        </div>
    );
}
