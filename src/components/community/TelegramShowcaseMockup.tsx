"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    CheckCircle2,
    Pin,
    Shield,
    BookOpen,
    Send,
    Flame,
    Rocket,
    Heart,
    Copy,
    Check,
    BarChart3,
    Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { motion, AnimatePresence } from "framer-motion";

interface TelegramShowcaseMockupProps {
    telegramUrl: string;
}

type TabType = "analysis" | "mindset" | "tips";

export function TelegramShowcaseMockup({ telegramUrl }: TelegramShowcaseMockupProps) {
    const [activeTab, setActiveTab] = useState<TabType>("analysis");
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

    // Initialize Visitor ID & fetch live reaction totals from server
    useEffect(() => {
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
        navigator.clipboard.writeText("https://t.me/GoldScalperNinja");
        setCopied(true);
        toast.success("Copied channel link: t.me/GoldScalperNinja");
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
        <div className="relative h-full w-full">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400/20 via-[#2AABEE]/20 to-amber-500/20 blur-2xl opacity-70 pointer-events-none" />

            <div className="relative h-full rounded-3xl border border-amber-200/90 dark:border-sky-500/30 bg-white/95 dark:bg-[#0E1621] text-gray-800 dark:text-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_25px_60px_rgba(15,23,42,0.4)] backdrop-blur-xl overflow-hidden flex flex-col">
                {/* Telegram Window Top Header */}
                <div className="bg-slate-100/90 dark:bg-[#17212B] px-4 py-3 sm:py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
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
                                12,480 subscribers • @GoldScalperNinja
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            title="Copy Telegram Channel Link"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all active:scale-95"
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
                            value="analysis"
                            className="w-full justify-center py-2.5 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <BarChart3 size={14} className="shrink-0" />
                            <span className="truncate">Gold Outlook</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="mindset"
                            className="w-full justify-center py-2.5 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <Shield size={14} className="shrink-0" />
                            <span className="truncate">Mindset & Rules</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="tips"
                            className="w-full justify-center py-2.5 text-xs font-black"
                            activeIndicatorClassName="!bg-[#2AABEE] shadow-md shadow-[#2AABEE]/25 border-0 rounded-xl"
                            activeTextClassName="!text-white"
                        >
                            <BookOpen size={14} className="shrink-0" />
                            <span className="truncate">SMC & PA Tips</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Telegram Active Stream Content with AnimatePresence Smooth Fade/Slide */}
                <div className="p-4 sm:p-4.5 space-y-3.5 bg-slate-50/70 dark:bg-[#0E1621] flex-1 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        {/* TAB 1: Daily Gold Market Outlook */}
                        {activeTab === "analysis" && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-500/15 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    <span className="flex items-center gap-1.5">
                                        <Pin size={13} className="text-[#2AABEE]" /> DAILY XAUUSD MARKET OUTLOOK
                                    </span>
                                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Zap size={12} /> Live Insight
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    📊 <strong>Gold Price Action & Liquidity Context:</strong> US CPI Inflation news context today. XAUUSD holding strong above key H4 Liquidity Pool ($2,340). Institutional order flow favors bullish continuation toward $2,358 resistance if support holds.
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-amber-200/60 dark:border-white/10">
                                    <span>Key Zones: <strong className="text-gray-800 dark:text-white">$2,335 - $2,358</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">Updated Today 08:30 AM</span>
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
                                className="bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-sky-500/10 dark:from-sky-500/15 dark:to-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                                    <span className="flex items-center gap-1.5">
                                        <Shield size={13} className="text-[#2AABEE]" /> TRADER DISCIPLINE RULE
                                    </span>
                                    <span className="text-xs font-bold text-[#2AABEE]">GoldScalperNinja Mindset</span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    🛡️ <strong>Rule #1 for Gold Traders:</strong> Never enter a trade without a pre-defined Stop Loss. Risk max 1-2% per position. In high-volatility XAUUSD trading, capital preservation is what separates professional traders from gamblers.
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-sky-200/60 dark:border-white/10">
                                    <span>Core Value: <strong className="text-sky-600 dark:text-sky-400 font-bold">1-2% Risk Cap</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">Capital Protection First</span>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: SMC & Price Action Tip */}
                        {activeTab === "tips" && (
                            <motion.div
                                key="tips"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-500/15 dark:to-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen size={13} className="text-emerald-500" /> PRICE ACTION & SMC LESSON
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                                        Pro Strategy
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                                    💡 <strong>Gold Liquidity Sweeps & CHOCH:</strong> Gold scalping requires waiting for Asian session liquidity sweeps before taking M5/M15 CHOCH entries. Never buy into resistance or sell directly into major H1 support.
                                </p>

                                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-emerald-200/60 dark:border-white/10">
                                    <span>Key Pattern: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Liquidity Sweep + CHOCH</strong></span>
                                    <span className="text-[10px] font-bold text-gray-400">High Confluence</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Telegram Reaction Bar with Live Pulsing Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1.5">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Live Reactions
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {[
                                { key: "flame" as const, emoji: "🔥", label: "Flame", activeColor: "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400" },
                                { key: "rocket" as const, emoji: "🚀", label: "Rocket", activeColor: "bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-400" },
                                { key: "heart" as const, emoji: "❤️", label: "Heart", activeColor: "bg-red-500/20 border-red-500 text-red-600 dark:text-red-400" },
                                { key: "hundred" as const, emoji: "💯", label: "100", activeColor: "bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400" },
                                { key: "handshake" as const, emoji: "🤝", label: "Handshake", activeColor: "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400" },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleReaction(item.key)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-90 ${
                                        userReacted[item.key]
                                            ? item.activeColor
                                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-slate-200/60 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <span className="text-xs">{item.emoji}</span>
                                    <span>{reactions[item.key]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direct Telegram Action Banner inside Mockup */}
                    <div className="bg-gradient-to-r from-[#2AABEE] to-[#1E88E5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-md text-white">
                        <div className="text-left">
                            <span className="block text-xs sm:text-sm font-black">Join GoldScalperNinja Telegram</span>
                            <span className="text-[11px] text-sky-100 font-medium">
                                Get daily Gold context & live trading insights
                            </span>
                        </div>
                        <a
                            href={telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#1E88E5] font-black text-xs shadow-xs hover:bg-sky-50 transition-all shrink-0 active:scale-95"
                        >
                            <Send size={14} /> Join Free
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
