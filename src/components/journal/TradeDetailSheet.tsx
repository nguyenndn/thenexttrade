"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { utcTime } from "@/lib/utils";
import { ShareTradeModal } from "./ShareTradeModal";
import {
    Share2,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Tag,
    Brain,
    BarChart3,
    MessageSquare,
    Check,
    X,
    Medal,
    Target,
    ShieldAlert,
    Scale,
    Calendar,
    Trash2,
    Pencil,
} from "lucide-react";
import { PlaybookLightbox } from "@/components/strategies/PlaybookLightbox";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { getMistakeByCode } from "@/lib/mistakes";
import { EmptyState } from "@/components/ui/EmptyState";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { deleteJournalEntry } from "@/actions/journal";

import { PlanVsActualPanel } from "./PlanVsActualPanel";
import { formatDashboardCurrency, normalizeCurrencyCode } from "@/lib/utils/cent-account";

function isSafeImageUrl(url: unknown): url is string {
    return (
        typeof url === "string" &&
        (url.startsWith("https://") ||
            (url.startsWith("/") && !url.startsWith("//")))
    );
}

interface EntryAccountInfo {
    currency?: string | null;
    server?: string | null;
    initialBalance?: number | null;
    balance?: number | null;
}

interface StrategyReference {
    id?: string;
    name: string;
    color?: string | null;
    isPlaybook?: boolean;
    setupType?: string | null;
    idealEntry?: string | null;
    idealStopLoss?: string | null;
    riskRewardMin?: number | null;
    referenceImages?: string[];
}

interface CoachPlanSummary {
    keepDoing?: string | null;
    fixNext?: string | null;
}

interface MarketEventItem {
    id: string;
    currency: string;
    impact: string;
    title: string;
    date: string | Date;
}

export interface JournalDetailEntry {
    id: string;
    entryDate: string;
    exitDate: string | null;
    symbol: string;
    type: "BUY" | "SELL";
    pnl: number | null;
    status: "OPEN" | "CLOSED";
    result: "WIN" | "LOSS" | "BREAK_EVEN" | "BE_PLUS" | null;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
    strategy: string | null;
    tags: string[];
    mistakes: string[];
    emotionBefore: string | null;
    emotionAfter?: string | null;
    confidenceLevel?: number | null;
    notesPsychology?: string | null;
    entryReason?: string | null;
    exitReason?: string | null;
    shareDescription?: string | null;
    shareMode?: string | null;
    syncSource?: string | null;
    externalTicket?: string | null;
    accountId: string | null;
    account?: EntryAccountInfo | null;
    notes?: string | null;
    mindset?: string | null;
    images?: string[];
    tradePlan?: React.ComponentProps<typeof PlanVsActualPanel>["plan"] | null;
    ruleChecks?: React.ComponentProps<typeof PlanVsActualPanel>["entry"]["ruleChecks"];
    autopilotStatus?: string | null;
    followedPlan?: boolean | null;
    playbookGrade?: string | null;
    playbookComplianceScore?: number | null;
    commission?: number | null;
    swap?: number | null;
    grossProfit?: number | null;
}

interface TradeDetailSheetProps {
    entry: JournalDetailEntry | null;
    strategies?: StrategyReference[];
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (entry: JournalDetailEntry) => void;
    onDeleted?: (deletedId: string) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    currency?: string;
}

export function TradeDetailSheet({
    entry,
    strategies = [],
    isOpen,
    onClose,
    onEdit,
    onDeleted,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    currency = "USD",
}: TradeDetailSheetProps) {
    const router = useRouter();
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sheetLightboxIndex, setSheetLightboxIndex] = useState<number | null>(null);
    const [activeCoachPlan, setActiveCoachPlan] = useState<CoachPlanSummary | null>(null);
    const [marketEvents, setMarketEvents] = useState<MarketEventItem[]>([]);

    useEffect(() => {
        setShowDeleteConfirm(false);
        if (isOpen && entry && !entry.id.startsWith("sample-")) {
            import("@/actions/ai-coach").then(({ getActiveCoachPlan }) => {
                getActiveCoachPlan().then((res) => {
                    if (res && res.success && res.data) {
                        setActiveCoachPlan(res.data);
                    }
                });
            });

            import("@/actions/journal").then(({ getTradeMarketContext }) => {
                getTradeMarketContext(entry.symbol, entry.entryDate).then((res) => {
                    if (res && res.success) {
                        setMarketEvents((res.events as MarketEventItem[]) || []);
                    }
                });
            });
        }
    }, [isOpen, entry]);

    if (!entry) return null;

    const entryCurrency = normalizeCurrencyCode(
        entry.account?.currency || currency,
        entry.account?.server
    );

    const baseBalance =
        entry.account?.initialBalance && entry.account.initialBalance > 0
            ? entry.account.initialBalance
            : entry.account?.balance && entry.account.balance > 0
              ? entry.account.balance
              : null;

    const percentGain =
        baseBalance !== null && entry.pnl !== null && entry.pnl !== undefined
            ? Number(((entry.pnl / baseBalance) * 100).toFixed(2))
            : null;

    const canDeleteManualTrade =
        !entry.id.startsWith("sample-") &&
        entry.syncSource !== "EA" &&
        entry.syncSource !== "WEBHOOK";

    const handleDeleteTrade = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteJournalEntry(entry.id);
            if (res?.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Trade deleted");
            setShowDeleteConfirm(false);
            onDeleted?.(entry.id);
            onClose();
            router.refresh();
        } catch {
            toast.error("Failed to delete trade");
        } finally {
            setIsDeleting(false);
        }
    };

    const safeEntryImages = (entry.images ?? []).filter(isSafeImageUrl);

    const isWin = Boolean(entry.pnl && entry.pnl > 0);
    const pnlColor =
        entry.pnl && entry.pnl > 0
            ? "text-primary"
            : entry.pnl && entry.pnl < 0
              ? "text-red-500"
              : "text-gray-600";
    const typeColor = entry.type === "BUY" ? "bg-emerald-500" : "bg-red-500";

    const currentStrategy = entry.strategy
        ? strategies.find(
              (s) => s.name === entry.strategy || s.id === entry.strategy
          )
        : null;
    const strategyColor = currentStrategy?.color || "#6B7280";
    const safeReferenceImages = (currentStrategy?.referenceImages ?? []).filter(
        isSafeImageUrl
    );

    // Hit Logic calculations (only if trade is closed)
    const isBuy = entry.type === "BUY";
    const isTPHit =
        entry.status === "CLOSED" && entry.exitPrice && entry.takeProfit
            ? isBuy
                ? entry.exitPrice >= entry.takeProfit
                : entry.exitPrice <= entry.takeProfit
            : false;

    const isSLHit =
        entry.status === "CLOSED" && entry.exitPrice && entry.stopLoss
            ? isBuy
                ? entry.exitPrice <= entry.stopLoss
                : entry.exitPrice >= entry.stopLoss
            : false;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            {/* Main Sheet Container - Compact ~20% narrower drawer (720px max) */}
            <SheetContent className="flex flex-col h-dvh sm:max-w-[720px] p-0 gap-0 bg-white dark:bg-[#0D111C] border-l border-dashboard dark:border-white/10 shadow-2xl overflow-hidden [&>button.absolute]:hidden">
                {/* 
 A11y Requirement: Radix DialogContent requires a DialogTitle. 
 Since we build our own visual header below, we hide the official one for screen readers.
 */}
                <VisuallyHidden>
                    <SheetHeader>
                        <SheetTitle>Trade Details</SheetTitle>
                        <SheetDescription>
                            View metrics, analysis, and screenshots for this
                            trade.
                        </SheetDescription>
                    </SheetHeader>
                </VisuallyHidden>

                {/* Fixed Non-Scrolling Minimal Icon Header */}
                <div className="shrink-0 relative z-30 bg-white dark:bg-[#0D111C] border-b border-dashboard px-3.5 sm:px-5 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono tabular-nums text-gray-400 dark:text-gray-500 truncate">
                            {entry.externalTicket
                                ? `#${entry.externalTicket}`
                                : utcTime(entry.entryDate, "MMM dd, yyyy")}
                        </span>

                        {/* Right: Pure Frameless Action Icons (Edit, Delete, Share, Close) */}
                        <div className="flex items-center gap-1 shrink-0">
                            {onEdit && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit trade"
                                    title="Edit trade"
                                    onClick={() => {
                                        onClose();
                                        onEdit(entry);
                                    }}
                                    className="h-8 w-8 rounded-lg bg-transparent border-none shadow-none text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
                                >
                                    <Pencil size={15} strokeWidth={1.9} />
                                </Button>
                            )}

                            {canDeleteManualTrade && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete trade"
                                    title="Delete trade"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="h-8 w-8 rounded-lg bg-transparent border-none shadow-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 size={15} strokeWidth={1.9} />
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Share trade"
                                title="Share trade"
                                onClick={() => setShowShareModal(true)}
                                className="h-8 w-8 rounded-lg bg-transparent border-none shadow-none text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300 hover:bg-amber-500/10"
                            >
                                <Share2 size={15} strokeWidth={2} />
                            </Button>

                            <span
                                className="h-3.5 w-px bg-gray-200 dark:bg-white/10 mx-1"
                                aria-hidden="true"
                            />

                            <SheetClose
                                aria-label="Close trade details"
                                title="Close"
                                className="rounded-lg h-8 w-8 p-0 border-none bg-transparent hover:bg-gray-100/80 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={16} strokeWidth={2} />
                            </SheetClose>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                    {/* Hero Card - Original Side Chevron Positions at Compact 28px Scale */}
                    <div className="relative bg-white dark:bg-[#1E2028] rounded-xl p-3.5 sm:p-5 shadow-sm border border-dashboard overflow-hidden group">
                        {/* Subtle Decorative Glow */}
                        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gold/10 rounded-full blur-[90px] pointer-events-none group-hover:bg-gold/15 transition-all duration-700"></div>

                        <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4">
                            {/* Left: Compact Prev Button + Symbol, Side & Price Trajectory */}
                            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onPrev}
                                    disabled={!hasPrev}
                                    aria-label="Previous trade"
                                    title="Previous trade"
                                    className="h-7 w-7 shrink-0 rounded-lg bg-gray-100/80 dark:bg-white/[0.04] hover:bg-gray-200/80 dark:hover:bg-white/10 border-none shadow-none text-gray-600 dark:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={15} strokeWidth={2} />
                                </Button>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1">
                                        <h1 className="text-lg sm:text-2xl md:text-[28px] leading-none font-black text-gray-800 dark:text-white tracking-tight truncate">
                                            {entry.symbol}
                                        </h1>
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-lg text-[10px] font-black text-white uppercase tracking-wider shadow-sm shrink-0",
                                                isBuy ? "shadow-emerald-500/20" : "shadow-red-500/20",
                                                typeColor
                                            )}
                                        >
                                            {entry.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300 font-mono tabular-nums text-xs sm:text-[13px] font-bold">
                                        <span>{entry.entryPrice}</span>
                                        <span className="text-gray-300 dark:text-white/25">
                                            <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                                        </span>
                                        <span
                                            className={
                                                isWin
                                                    ? "text-primary"
                                                    : entry.pnl && entry.pnl < 0
                                                      ? "text-red-500"
                                                      : ""
                                            }
                                        >
                                            {entry.exitPrice || "???"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: PnL Big Number + Compact Next Button */}
                            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                                <div className="text-right">
                                    <div
                                        className={cn(
                                            "text-lg sm:text-2xl md:text-[28px] leading-none font-black font-mono tabular-nums tracking-tight flex items-center justify-end gap-1.5",
                                            pnlColor
                                        )}
                                    >
                                        {isWin ? (
                                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        )}
                                        {formatDashboardCurrency(entry.pnl || 0, entryCurrency, {
                                            signDisplay: "always",
                                        })}
                                    </div>
                                    <div className="text-gray-500 font-mono tabular-nums text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1">
                                        {percentGain !== null
                                            ? `${percentGain > 0 ? "+" : ""}${percentGain.toFixed(2)}% Gain`
                                            : "—"}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onNext}
                                    disabled={!hasNext}
                                    aria-label="Next trade"
                                    title="Next trade"
                                    className="h-7 w-7 shrink-0 rounded-lg bg-gray-100/80 dark:bg-white/[0.04] hover:bg-gray-200/80 dark:hover:bg-white/10 border-none shadow-none text-gray-600 dark:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={15} strokeWidth={2} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="metrics" className="w-full" tabsId="trade-detail-tabs">
                        <TabsList
                            className={cn(
                                "w-full grid gap-0 bg-transparent dark:bg-transparent p-0 rounded-none border-0 border-b border-dashboard mb-0 overflow-visible sm:w-auto sm:inline-flex sm:gap-1 sm:bg-[#F1F3F5] sm:dark:bg-[#1A1D27] sm:p-1 sm:rounded-lg sm:border sm:mb-3.5",
                                entry.tradePlan ? "grid-cols-4" : "grid-cols-3"
                            )}
                        >
                            <TabsTrigger
                                value="metrics"
                                className="w-full sm:w-auto justify-center px-1 sm:px-3 py-1.5 sm:py-1 rounded-none sm:rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-1.5 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-sm sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="sm:hidden truncate">Metrics</span>
                                <span className="hidden sm:inline">Trade Metrics</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="tags"
                                className="w-full sm:w-auto justify-center px-1 sm:px-3 py-1.5 sm:py-1 rounded-none sm:rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-1.5 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-sm sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="sm:hidden truncate">Context</span>
                                <span className="hidden sm:inline">Trade Context</span>
                            </TabsTrigger>
                            {entry.tradePlan && (
                                <TabsTrigger
                                    value="comparison"
                                    className="w-full sm:w-auto justify-center px-1 sm:px-3 py-1.5 sm:py-1 rounded-none sm:rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-1.5 min-w-0"
                                    activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-sm sm:shadow-amber-500/20"
                                    activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                                >
                                    <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    <span className="sm:hidden truncate">Plan</span>
                                    <span className="hidden sm:inline">Plan vs Actual</span>
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="ai-insights"
                                className="w-full sm:w-auto justify-center px-1 sm:px-3 py-1.5 sm:py-1 rounded-none sm:rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-1.5 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-sm sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="sm:hidden truncate">
                                    {entry.tradePlan ? "AI" : "AI Insights"}
                                </span>
                                <span className="hidden sm:inline">AI Insights</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="ai-insights"
                            className="mt-2.5 sm:mt-4 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            {activeCoachPlan ? (
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-3 sm:p-4 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-gray-500 mb-2.5 sm:mb-3 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        Trader's Current Focus
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                                        {(activeCoachPlan.keepDoing?.length ??
                                            0) > 0 && (
                                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-2">
                                                    What's Working
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {activeCoachPlan.keepDoing}
                                                </p>
                                            </div>
                                        )}
                                        {(activeCoachPlan.fixNext?.length ??
                                            0) > 0 && (
                                            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-2">
                                                    Needs Fix
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {activeCoachPlan.fixNext}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 sm:p-6 text-center text-gray-500 bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm">
                                    <Brain
                                        size={40}
                                        className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2.5 opacity-20 text-gray-400"
                                    />
                                    <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                                        No AI Insights Available
                                    </p>
                                    <p className="text-xs mt-1 leading-relaxed max-w-md mx-auto">
                                        Log more trades and run a Weekly
                                        Review to generate personalized
                                        execution feedback.
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent
                            value="metrics"
                            className="mt-2.5 sm:mt-4 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            {/* Unified Performance Card - Compact Grid Layout */}
                            <div className="space-y-2 sm:space-y-2.5">
                                <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest text-gray-500 flex items-center gap-1.5 pl-1">
                                    <BarChart3 className="w-3 h-3" />
                                    Performance Summary
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm relative overflow-hidden group">
                                    {/* Ambient Glow based on Result */}
                                    <div
                                        className={cn(
                                            "absolute top-0 right-0 w-[320px] h-[320px] rounded-full blur-[110px] pointer-events-none opacity-15 transition-all duration-700",
                                            isWin
                                                ? "bg-green-500 group-hover:opacity-25"
                                                : "bg-red-500 group-hover:opacity-25"
                                        )}
                                    ></div>

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashboard">
                                        {/* Left Column: Trade Info & Costs */}
                                        <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-5">
                                            {/* Trade Information */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center gap-1.5">
                                                    <Clock
                                                        size={11}
                                                        className="text-primary"
                                                    />{" "}
                                                    Execution Timeline
                                                </h4>
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] px-3 py-2 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                                            Volume
                                                        </span>
                                                        <span className="text-xs font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                                            {entry.lotSize} Lots
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] px-3 py-2 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                                            Open
                                                        </span>
                                                        <span className="text-xs font-bold font-mono tabular-nums text-gray-700 dark:text-gray-300">
                                                            {utcTime(
                                                                entry.entryDate,
                                                                "MMM dd, HH:mm"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] px-3 py-2 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                                            Close
                                                        </span>
                                                        <span className="text-xs font-bold font-mono tabular-nums text-gray-700 dark:text-gray-300">
                                                            {entry.exitDate
                                                                ? utcTime(
                                                                      entry.exitDate,
                                                                      "MMM dd, HH:mm"
                                                                  )
                                                                : "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction Costs */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center gap-1.5">
                                                    <DollarSign
                                                        size={11}
                                                        className="text-yellow-500"
                                                    />{" "}
                                                    Transaction Fees
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2 sm:p-2.5 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-0.5">
                                                            Commission
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-[11px] sm:text-xs font-black font-mono tabular-nums",
                                                                (entry.commission || 0) < 0
                                                                    ? "text-red-500"
                                                                    : "text-gray-700 dark:text-white"
                                                            )}
                                                        >
                                                            {formatDashboardCurrency(
                                                                entry.commission || 0,
                                                                entryCurrency
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2 sm:p-2.5 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-0.5">
                                                            Swap
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-[11px] sm:text-xs font-black font-mono tabular-nums",
                                                                (entry.swap || 0) < 0
                                                                    ? "text-red-500"
                                                                    : "text-gray-700 dark:text-white"
                                                            )}
                                                        >
                                                            {formatDashboardCurrency(
                                                                entry.swap || 0,
                                                                entryCurrency
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2 sm:p-2.5 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-0.5">
                                                            Total Fees
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-[11px] sm:text-xs font-black font-mono tabular-nums",
                                                                ((entry.commission || 0) + (entry.swap || 0)) < 0
                                                                    ? "text-red-500"
                                                                    : "text-gray-700 dark:text-white"
                                                            )}
                                                        >
                                                            {formatDashboardCurrency(
                                                                (entry.commission || 0) + (entry.swap || 0),
                                                                entryCurrency
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Price & Results */}
                                        <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-5 bg-gray-50/30 dark:bg-white/[0.01]">
                                            {/* Price Summary */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center gap-1.5">
                                                    <TrendingUp
                                                        size={11}
                                                        className={cn(
                                                            isWin
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        )}
                                                    />{" "}
                                                    Price Execution
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard shadow-xs">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 block">
                                                            Entry Price
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                                            {entry.entryPrice}
                                                        </span>
                                                    </div>
                                                    <div className="relative bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard shadow-xs">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between gap-1">
                                                            Exit Price
                                                            {isTPHit && (
                                                                <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-lg tracking-wider font-black shadow-xs shadow-green-500/20">
                                                                    <Target size={9} className="inline-block mr-0.5 align-[-1px]" /> TP
                                                                </span>
                                                            )}
                                                            {isSLHit && (
                                                                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-lg tracking-wider font-black shadow-xs shadow-red-500/20">
                                                                    <ShieldAlert size={9} className="inline-block mr-0.5 align-[-1px]" /> SL
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs sm:text-sm font-black font-mono tabular-nums",
                                                                isTPHit
                                                                    ? "text-green-500"
                                                                    : isSLHit
                                                                      ? "text-red-500"
                                                                      : "text-gray-700 dark:text-white"
                                                            )}
                                                        >
                                                            {entry.exitPrice ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard shadow-xs opacity-80">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 block">
                                                            Stop Loss
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                                                            {entry.stopLoss ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard shadow-xs opacity-80">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 block">
                                                            Take Profit
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                                                            {entry.takeProfit ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trade Results Hub */}
                                            <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-4 rounded-lg border border-dashboard shadow-inner relative overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 opacity-[0.03] pattern-diagonal-lines pattern-size-4 pattern-bg-white",
                                                        isWin
                                                            ? "pattern-green-500"
                                                            : "pattern-red-500"
                                                    )}
                                                ></div>

                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-3 relative z-10 flex items-center gap-1.5">
                                                    <Medal
                                                        size={11}
                                                        className={pnlColor}
                                                    />{" "}
                                                    Final Outcome
                                                </h4>

                                                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">
                                                            Gross Profit
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs sm:text-base font-black font-mono tabular-nums",
                                                                (entry.grossProfit ?? (entry.pnl != null ? entry.pnl - (entry.commission || 0) - (entry.swap || 0) : 0)) >= 0
                                                                    ? "text-green-500"
                                                                    : "text-red-500"
                                                            )}
                                                        >
                                                            {Number(
                                                                entry.grossProfit ??
                                                                    (entry.pnl != null
                                                                        ? entry.pnl -
                                                                          (entry.commission || 0) -
                                                                          (entry.swap || 0)
                                                                        : 0)
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">
                                                            Percent Gain
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "text-xs sm:text-base font-black font-mono tabular-nums",
                                                                    percentGain !== null
                                                                        ? pnlColor
                                                                        : "text-gray-500"
                                                                )}
                                                            >
                                                                {percentGain !== null
                                                                    ? `${percentGain > 0 ? "+" : ""}${percentGain.toFixed(2)}%`
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 pt-2.5 sm:pt-3 border-t border-dashboard">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                                                            Net Profit
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "text-base sm:text-2xl font-black font-mono tabular-nums tracking-tight",
                                                                    pnlColor
                                                                )}
                                                            >
                                                                {isWin
                                                                    ? "+"
                                                                    : ""}
                                                                {entry.pnl?.toFixed(
                                                                    2
                                                                ) || "0.00"}
                                                            </span>
                                                            {isWin && (
                                                                <span className="bg-green-500/10 text-green-500 p-1 sm:p-1.5 rounded-lg shadow-xs shadow-green-500/20">
                                                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="tags"
                            className="mt-2.5 sm:mt-4 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            {/* Unified Analysis Card - Compact Grid Layout */}
                            <div className="space-y-2 sm:space-y-2.5">
                                <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest text-gray-500 flex items-center gap-1.5 pl-1">
                                    <Brain className="w-3 h-3" />
                                    Trade Analysis
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-3 sm:p-4 space-y-3 sm:space-y-4">
                                    {/* Market Context - Economic Events */}
                                    <div className="bg-amber-50/50 dark:bg-amber-500/5 p-3 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                                        <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Calendar size={12} className="text-amber-500" />
                                            Market Context (Economic Calendar)
                                        </h4>
                                        {marketEvents.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {marketEvents.map((ev) => (
                                                    <div key={ev.id} className="flex items-center justify-between bg-white dark:bg-[#1E2028] p-2 rounded-lg border border-dashboard text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "px-1.5 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                                                                ev.impact === "HIGH" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                                                            )}>
                                                                {ev.currency} • {ev.impact}
                                                            </span>
                                                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{ev.title}</span>
                                                        </div>
                                                        <span className="text-[11px] font-mono tabular-nums text-gray-500 dark:text-gray-400">
                                                            {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                No high-impact economic news scheduled near trade execution time.
                                            </p>
                                        )}
                                    </div>

                                    {/* Strategy Benchmark Panel */}
                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-3 rounded-lg border border-dashboard space-y-2.5">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Target size={13} className="text-amber-600 dark:text-gold" />
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    Strategy
                                                </h4>
                                            </div>

                                            {/* Grade badge */}
                                            {entry.playbookGrade && (
                                                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                                                    entry.playbookGrade === "A+"
                                                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                                        : entry.playbookGrade === "A"
                                                          ? "bg-gold/15 text-amber-600 dark:text-gold border border-gold/30"
                                                          : entry.playbookGrade === "B"
                                                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                                            : "bg-red-500/15 text-red-500 border border-red-500/30"
                                                }`}>
                                                    Grade: {entry.playbookGrade}
                                                </span>
                                            )}
                                        </div>

                                        {entry.strategy ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5"
                                                    style={{
                                                        backgroundColor: `${strategyColor}15`,
                                                        color: strategyColor,
                                                        borderColor: `${strategyColor}30`,
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: strategyColor }} />
                                                    {currentStrategy?.name || entry.strategy}
                                                </span>

                                                {currentStrategy?.setupType && (
                                                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[11px] font-bold">
                                                        {currentStrategy.setupType}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                No strategy selected
                                            </span>
                                        )}

                                        {/* Strategy Benchmark Details */}
                                        {currentStrategy &&
                                            (currentStrategy.idealEntry ||
                                                currentStrategy.idealStopLoss ||
                                                currentStrategy.riskRewardMin != null ||
                                                safeReferenceImages.length > 0) && (
                                            <div className="pt-2 border-t border-dashboard/50 space-y-2">
                                                {/* Ideal Specs */}
                                                {(currentStrategy.idealEntry ||
                                                    currentStrategy.idealStopLoss ||
                                                    currentStrategy.riskRewardMin != null) && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                        {currentStrategy.idealEntry && (
                                                            <div className="p-2 rounded-lg bg-white dark:bg-[#1E2028] border border-dashboard">
                                                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Ideal Entry</span>
                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">{currentStrategy.idealEntry}</span>
                                                            </div>
                                                        )}
                                                        {currentStrategy.idealStopLoss && (
                                                            <div className="p-2 rounded-lg bg-white dark:bg-[#1E2028] border border-dashboard">
                                                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Ideal SL</span>
                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">{currentStrategy.idealStopLoss}</span>
                                                            </div>
                                                        )}
                                                        {currentStrategy.riskRewardMin != null && (
                                                            <div className="p-2 rounded-lg bg-white dark:bg-[#1E2028] border border-dashboard">
                                                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Min R:R</span>
                                                                <span className="font-mono tabular-nums font-bold text-primary">{currentStrategy.riskRewardMin}:1</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reference Charts Lightbox trigger */}
                                                {safeReferenceImages.length > 0 && (
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                                                            Reference Charts ({safeReferenceImages.length})
                                                        </span>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {safeReferenceImages.map((url: string, idx: number) => (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    key={url}
                                                                    onClick={() => setSheetLightboxIndex(idx)}
                                                                    className="w-16 h-11 p-0 min-h-0 rounded-lg overflow-hidden border border-dashboard hover:border-primary transition-colors cursor-pointer"
                                                                    aria-label={`Preview reference chart ${idx + 1}`}
                                                                >
                                                                    <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Entry Reason & Exit Reason */}
                                    {(entry.entryReason || entry.exitReason) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                                            {entry.entryReason && (
                                                <div className="bg-gray-50/80 dark:bg-[#151925] p-3 rounded-lg border border-dashboard">
                                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <MessageSquare
                                                            size={11}
                                                            className="text-amber-600 dark:text-gold"
                                                        />{" "}
                                                        Entry Reason
                                                    </h4>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {entry.entryReason}
                                                    </p>
                                                </div>
                                            )}
                                            {entry.exitReason && (
                                                <div className="bg-gray-50/80 dark:bg-[#151925] p-3 rounded-lg border border-dashboard">
                                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <MessageSquare
                                                            size={11}
                                                            className="text-amber-600 dark:text-gold"
                                                        />{" "}
                                                        Exit Reason
                                                    </h4>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {entry.exitReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Psychological State - Full Width */}
                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-3 rounded-lg border border-dashboard relative overflow-hidden">
                                        <div className="absolute -bottom-5 -right-5 text-gold/5 -rotate-12 pointer-events-none">
                                            <Brain size={96} strokeWidth={1} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
                                            <Brain
                                                size={11}
                                                className="text-amber-600 dark:text-gold"
                                            />{" "}
                                            Psychological State
                                        </h4>
                                        <div className="relative z-10">
                                            {entry.emotionBefore ||
                                            entry.emotionAfter ||
                                            entry.confidenceLevel ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.emotionBefore && (
                                                            <span className="px-2.5 py-1 bg-gold/10 text-amber-600 dark:text-gold rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-gold/20">
                                                                Before:{" "}
                                                                {entry.emotionBefore}
                                                            </span>
                                                        )}
                                                        {entry.emotionAfter && (
                                                            <span className="px-2.5 py-1 bg-gold/10 text-amber-600 dark:text-gold rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-gold/20">
                                                                After:{" "}
                                                                {entry.emotionAfter}
                                                            </span>
                                                        )}
                                                        {entry.confidenceLevel && (
                                                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-gold rounded-lg text-[10px] sm:text-[11px] font-mono tabular-nums font-black uppercase tracking-wider border border-amber-500/20">
                                                                Confidence:{" "}
                                                                {entry.confidenceLevel}
                                                                /5
                                                            </span>
                                                        )}
                                                        {entry.followedPlan !== null &&
                                                            entry.followedPlan !== undefined && (
                                                                <span
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border ${
                                                                        entry.followedPlan
                                                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                                                    }`}
                                                                >
                                                                    {entry.followedPlan
                                                                        ? (<><Check size={11} className="inline-block mr-1 align-[-1px]" /> Followed Plan</>)
                                                                        : (<><X size={11} className="inline-block mr-1 align-[-1px]" /> Deviated</>)}
                                                                </span>
                                                            )}
                                                    </div>
                                                    {entry.notesPsychology && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic border-l-2 border-gold/30 pl-2.5">
                                                            {entry.notesPsychology}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-1">
                                                    <EmptyState
                                                        icon={Brain}
                                                        title="Mindset Not Recorded"
                                                        description="Emotion tracking was skipped for this execution."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Tags */}
                                    <div className="pt-3 border-t border-dashboard">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Tag
                                                size={11}
                                                className="text-primary"
                                            />{" "}
                                            Filtering Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {entry.tags &&
                                            entry.tags.length > 0 ? (
                                                entry.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-dashboard hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-default"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="w-full">
                                                    <EmptyState
                                                        icon={Tag}
                                                        title="No Custom Tags"
                                                        description="Tags help you categorize trades by specific setups or events."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mistakes */}
                                    <div className="pt-3 border-t border-dashboard">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <ShieldAlert
                                                size={11}
                                                className="text-red-500"
                                            />{" "}
                                            Execution Flaws
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {entry.mistakes &&
                                            entry.mistakes.length > 0 ? (
                                                entry.mistakes.map(
                                                    (mistakeCode) => {
                                                        const mistake =
                                                            getMistakeByCode(
                                                                mistakeCode
                                                            );
                                                        return (
                                                            <span
                                                                key={
                                                                    mistakeCode
                                                                }
                                                                className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-red-500/20 flex items-center gap-1.5"
                                                            >
                                                                <ShieldAlert size={12} className="shrink-0" />
                                                                <span>
                                                                    {mistake
                                                                        ? mistake.name
                                                                        : mistakeCode}
                                                                </span>
                                                            </span>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <div className="w-full p-2.5 sm:p-3 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-center gap-2.5">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                                                        <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-white">
                                                            Flawless Execution
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            No trading mistakes
                                                            were recorded for
                                                            this entry.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        {entry.tradePlan && (
                            <TabsContent
                                value="comparison"
                                className="mt-2.5 sm:mt-4 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            >
                                <div>
                                    <PlanVsActualPanel
                                        plan={entry.tradePlan}
                                        entry={entry}
                                        currency={entryCurrency}
                                    />
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* Screenshots - Always visible at bottom */}
                    {safeEntryImages.length > 0 && (
                        <div className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-4 rounded-xl border border-dashboard">
                            <h4 className="text-[10px] sm:text-[11px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-3 bg-gold rounded-full"></div>
                                Trade Screenshots
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {safeEntryImages.map((imgUrl, idx) => (
                                        <a
                                            key={idx}
                                            href={imgUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative aspect-video rounded-lg overflow-hidden border border-dashboard group hover:ring-2 ring-primary transition-all"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Trade Screenshot ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <div className="bg-white/90 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View Full Size
                                                </div>
                                            </div>
                                        </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>

            <ShareTradeModal
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                entry={entry}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Trade"
                description={`Permanently delete this ${entry.symbol} ${entry.type} trade from your journal? This action cannot be undone.`}
                confirmText="Delete Trade"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDeleteTrade}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Playbook Reference Chart Lightbox */}
            {sheetLightboxIndex !== null && (
                <PlaybookLightbox
                    isOpen={sheetLightboxIndex !== null}
                    images={safeReferenceImages}
                    initialIndex={sheetLightboxIndex}
                    title={`${currentStrategy?.name || entry.strategy} — Reference Chart`}
                    onClose={() => setSheetLightboxIndex(null)}
                />
            )}
        </Sheet>
    );
}
