"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { utcTime } from "@/lib/utils";
import { ShareTradeModal } from "./ShareTradeModal";
import {
    Share2,
    ArrowLeft,
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
    BookOpen,
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
            {/* Main Sheet Container - Fixed flex column so header never overlaps scrolled content */}
            <SheetContent className="flex flex-col h-dvh sm:max-w-4xl p-0 gap-0 bg-white dark:bg-[#0D111C] border-l border-dashboard dark:border-white/10 shadow-2xl overflow-hidden [&>button.absolute]:hidden">
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

                {/* Fixed Non-Scrolling Header Section */}
                <div className="shrink-0 relative z-30 bg-white dark:bg-[#0D111C] border-b border-dashboard px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-4 min-w-0">
                            <h2 className="text-base sm:text-lg font-bold text-gray-700 dark:text-white truncate">
                                Trade Details
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {onEdit && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="smd"
                                    aria-label="Edit trade"
                                    onClick={() => {
                                        onClose();
                                        onEdit(entry);
                                    }}
                                    className="rounded-lg font-bold flex items-center gap-1.5"
                                >
                                    <Pencil size={14} strokeWidth={2.2} />
                                    <span className="hidden sm:inline">Edit</span>
                                </Button>
                            )}
                            {canDeleteManualTrade && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="smd"
                                    aria-label="Delete trade"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="rounded-lg font-bold text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 flex items-center gap-1.5 transition-colors"
                                >
                                    <Trash2 size={15} strokeWidth={2.2} />
                                    <span className="hidden sm:inline">Delete</span>
                                </Button>
                            )}
                            <Button
                                size="smd"
                                onClick={() => setShowShareModal(true)}
                                className="bg-gold hover:bg-amber-600 !text-white shadow-md shadow-amber-500/25 rounded-lg font-bold flex items-center gap-1.5 transition-all border-none"
                            >
                                <Share2 size={15} strokeWidth={2.5} />
                                Share
                            </Button>
                            <SheetClose
                                aria-label="Close trade details"
                                className="rounded-lg h-9 w-9 sm:h-10 sm:w-10 p-0 border border-dashboard bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white transition-colors"
                            >
                                <X size={18} className="sm:w-5 sm:h-5" />
                            </SheetClose>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide p-3 sm:p-6 space-y-3 sm:space-y-5">
                    {/* Hero Card - Premium Glass/Glow Effect */}
                    <div className="relative bg-white dark:bg-[#1E2028] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl border border-dashboard overflow-hidden group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/20 transition-all duration-700"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-8">
                            {/* Left: Symbol & Type */}
                            <div className="flex items-center gap-2 sm:gap-6">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onPrev}
                                    disabled={!hasPrev}
                                    aria-label="Previous Trade"
                                    className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                                >
                                    <ArrowLeft size={16} strokeWidth={2} className="sm:w-[18px] sm:h-[18px]" />
                                </Button>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                        <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-gray-700 dark:text-white tracking-tighter truncate">
                                            {entry.symbol}
                                        </h1>
                                        <span
                                            className={cn(
                                                "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black text-white uppercase tracking-wider shadow-lg shrink-0",
                                                isBuy ? "shadow-emerald-500/20" : "shadow-red-500/20",
                                                typeColor
                                            )}
                                        >
                                            {entry.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300 font-mono tabular-nums text-xs sm:text-sm md:text-base font-bold">
                                        <span>{entry.entryPrice}</span>
                                        <span className="text-gray-300 dark:text-white/20">
                                            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
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

                            {/* Right: PnL Big Number */}
                            <div className="flex items-center gap-2 sm:gap-6">
                                <div className="text-right">
                                    <div
                                        className={cn(
                                            "text-xl sm:text-4xl md:text-5xl font-black font-mono tabular-nums tracking-tighter flex items-center justify-end gap-1.5 sm:gap-2",
                                            pnlColor
                                        )}
                                    >
                                        {isWin ? (
                                            <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 shrink-0" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 sm:w-8 sm:h-8 shrink-0" />
                                        )}
                                        {formatDashboardCurrency(entry.pnl || 0, entryCurrency, {
                                            signDisplay: "always",
                                        })}
                                    </div>
                                    <div className="text-gray-500 font-mono tabular-nums text-[11px] sm:text-xs font-black uppercase tracking-widest mt-1 sm:mt-2">
                                        {percentGain !== null
                                            ? `${percentGain > 0 ? "+" : ""}${percentGain.toFixed(2)}% Gain`
                                            : "—"}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onNext}
                                    disabled={!hasNext}
                                    aria-label="Next Trade"
                                    className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                                >
                                    <ArrowRight size={16} strokeWidth={2} className="sm:w-[18px] sm:h-[18px]" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="metrics" className="w-full" tabsId="trade-detail-tabs">
                        <TabsList
                            className={cn(
                                "w-full grid gap-0 bg-transparent dark:bg-transparent p-0 rounded-none border-0 border-b border-dashboard mb-0 overflow-visible sm:w-auto sm:inline-flex sm:gap-1 sm:bg-[#F1F3F5] sm:dark:bg-[#1A1D27] sm:p-1 sm:rounded-lg sm:border sm:mb-5",
                                entry.tradePlan ? "grid-cols-4" : "grid-cols-3"
                            )}
                        >
                            <TabsTrigger
                                value="metrics"
                                className="w-full sm:w-auto justify-center px-1 sm:px-4 py-2 sm:py-1.5 rounded-none sm:rounded-lg text-[11px] sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-2 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                <span className="sm:hidden truncate">Metrics</span>
                                <span className="hidden sm:inline">Trade Metrics</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="tags"
                                className="w-full sm:w-auto justify-center px-1 sm:px-4 py-2 sm:py-1.5 rounded-none sm:rounded-lg text-[11px] sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-2 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <Tag className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                <span className="sm:hidden truncate">Context</span>
                                <span className="hidden sm:inline">Trade Context</span>
                            </TabsTrigger>
                            {entry.tradePlan && (
                                <TabsTrigger
                                    value="comparison"
                                    className="w-full sm:w-auto justify-center px-1 sm:px-4 py-2 sm:py-1.5 rounded-none sm:rounded-lg text-[11px] sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-2 min-w-0"
                                    activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                                    activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                                >
                                    <Scale className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                    <span className="sm:hidden truncate">Plan</span>
                                    <span className="hidden sm:inline">Plan vs Actual</span>
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="ai-insights"
                                className="w-full sm:w-auto justify-center px-1 sm:px-4 py-2 sm:py-1.5 rounded-none sm:rounded-lg text-[11px] sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-gray-200 sm:dark:hover:border-white/10 gap-1 sm:gap-2 min-w-0"
                                activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                                activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                            >
                                <Brain className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                <span className="sm:hidden truncate">
                                    {entry.tradePlan ? "AI" : "AI Insights"}
                                </span>
                                <span className="hidden sm:inline">AI Insights</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="ai-insights"
                            className="mt-2.5 sm:mt-6 space-y-3 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-0 sm:pt-2"
                        >
                            {activeCoachPlan ? (
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-3 sm:p-6 shadow-xl">
                                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                        Trader's Current Focus
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                                        {(activeCoachPlan.keepDoing?.length ??
                                            0) > 0 && (
                                            <div className="p-3 sm:p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                <h4 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 sm:mb-3 flex items-center gap-2">
                                                    What's Working
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {activeCoachPlan.keepDoing}
                                                </p>
                                            </div>
                                        )}
                                        {(activeCoachPlan.fixNext?.length ??
                                            0) > 0 && (
                                            <div className="p-3 sm:p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                                <h4 className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 mb-2 sm:mb-3 flex items-center gap-2">
                                                    Needs Fix
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {activeCoachPlan.fixNext}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 sm:p-8 text-center text-gray-500 bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-xl">
                                    <Brain
                                        size={48}
                                        className="w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-2.5 sm:mb-4 opacity-20 text-gray-400"
                                    />
                                    <p className="text-xs sm:text-base font-bold text-gray-600 dark:text-gray-300">
                                        No AI Insights Available
                                    </p>
                                    <p className="text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">
                                        Log more trades and run a Weekly
                                        Review to generate personalized
                                        execution feedback.
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent
                            value="metrics"
                            className="mt-2.5 sm:mt-6 space-y-3 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            {/* Unified Performance Card - Premium Grid Layout */}
                            <div className="space-y-2 sm:space-y-6 pt-0 sm:pt-2">
                                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-gray-500 mb-2 sm:mb-6 flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2">
                                    <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    Performance Summary
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-xl relative overflow-hidden group">
                                    {/* Ambient Glow based on Result */}
                                    <div
                                        className={cn(
                                            "absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20 transition-all duration-700",
                                            isWin
                                                ? "bg-green-500 group-hover:opacity-30"
                                                : "bg-red-500 group-hover:opacity-30"
                                        )}
                                    ></div>

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashboard">
                                        {/* Left Column: Trade Info & Costs */}
                                        <div className="p-3 sm:p-8 space-y-4 sm:space-y-8">
                                            {/* Trade Information */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-4 flex items-center gap-2">
                                                    <Clock
                                                        size={12}
                                                        className="text-primary"
                                                    />{" "}
                                                    Execution Timeline
                                                </h4>
                                                <div className="space-y-2 sm:space-y-4">
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-xs text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider">
                                                            Volume
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                                            {entry.lotSize} Lots
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-xs text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider">
                                                            Open
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-gray-700 dark:text-gray-300">
                                                            {utcTime(
                                                                entry.entryDate,
                                                                "MMM dd, HH:mm"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] sm:text-xs text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider">
                                                            Close
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-gray-700 dark:text-gray-300">
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
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-4 flex items-center gap-2">
                                                    <DollarSign
                                                        size={12}
                                                        className="text-yellow-500"
                                                    />{" "}
                                                    Transaction Fees
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-1">
                                                            Commission
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs font-black font-mono tabular-nums",
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
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-1">
                                                            Swap
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs font-black font-mono tabular-nums",
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
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-3 rounded-lg border border-dashboard flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:mb-1">
                                                            Total Fees
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs font-black font-mono tabular-nums",
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
                                        <div className="p-3 sm:p-8 space-y-4 sm:space-y-8 bg-gray-50/30 dark:bg-white/[0.01]">
                                            {/* Price Summary */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-4 flex items-center gap-2">
                                                    <TrendingUp
                                                        size={12}
                                                        className={cn(
                                                            isWin
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        )}
                                                    />{" "}
                                                    Price Execution
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-4 rounded-lg border border-dashboard shadow-sm">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                                                            Entry Price
                                                        </span>
                                                        <span className="text-sm sm:text-lg font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                                            {entry.entryPrice}
                                                        </span>
                                                    </div>
                                                    <div className="relative bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-4 rounded-lg border border-dashboard shadow-sm">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-between gap-1">
                                                            Exit Price
                                                            {isTPHit && (
                                                                <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-lg tracking-widest font-black shadow-sm shadow-green-500/20">
                                                                    <Target size={10} className="inline-block mr-1 align-[-1px]" /> TP HIT
                                                                </span>
                                                            )}
                                                            {isSLHit && (
                                                                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-lg tracking-widest font-black shadow-sm shadow-red-500/20">
                                                                    <ShieldAlert size={10} className="inline-block mr-1 align-[-1px]" /> SL HIT
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-sm sm:text-lg font-black font-mono tabular-nums",
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
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-4 rounded-lg border border-dashboard shadow-sm opacity-80">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                                                            Stop Loss
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                                                            {entry.stopLoss ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-2.5 sm:p-4 rounded-lg border border-dashboard shadow-sm opacity-80">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                                                            Take Profit
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                                                            {entry.takeProfit ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trade Results Hub */}
                                            <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-6 rounded-lg border border-dashboard shadow-inner relative overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 opacity-[0.03] pattern-diagonal-lines pattern-size-4 pattern-bg-white",
                                                        isWin
                                                            ? "pattern-green-500"
                                                            : "pattern-red-500"
                                                    )}
                                                ></div>

                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 sm:mb-5 relative z-10 flex items-center gap-2">
                                                    <Medal
                                                        size={12}
                                                        className={pnlColor}
                                                    />{" "}
                                                    Final Outcome
                                                </h4>

                                                <div className="grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider block mb-1">
                                                            Gross Profit
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-sm sm:text-xl font-black font-mono tabular-nums",
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
                                                        <span className="text-[10px] text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider block mb-1">
                                                            Percent Gain
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "text-sm sm:text-xl font-black font-mono tabular-nums",
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
                                                    <div className="col-span-2 pt-2.5 sm:pt-4 border-t border-dashboard">
                                                        <span className="text-[10px] text-gray-500 sm:text-gray-600 font-bold uppercase tracking-wider block mb-1 sm:mb-2">
                                                            Net Profit
                                                        </span>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <span
                                                                className={cn(
                                                                    "text-lg sm:text-4xl font-black font-mono tabular-nums tracking-tighter",
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
                                                                <span className="bg-green-500/10 text-green-500 p-1.5 sm:p-2 rounded-lg shadow-lg shadow-green-500/20">
                                                                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
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
                            className="mt-2.5 sm:mt-6 space-y-3 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            {/* Unified Analysis Card - Premium Grid Layout */}
                            <div className="space-y-2 sm:space-y-6 pt-0 sm:pt-2">
                                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-gray-500 mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2">
                                    <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    Trade Analysis
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-xl p-3 sm:p-5 space-y-3.5 sm:space-y-5">
                                    {/* Market Context - Economic Events */}
                                    <div className="bg-amber-50/50 dark:bg-amber-500/5 p-3 sm:p-4 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                                        <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Calendar size={13} className="text-amber-500" />
                                            Market Context (Economic Calendar)
                                        </h4>
                                        {marketEvents.length > 0 ? (
                                            <div className="space-y-2">
                                                {marketEvents.map((ev) => (
                                                    <div key={ev.id} className="flex items-center justify-between bg-white dark:bg-[#1E2028] p-2.5 rounded-lg border border-dashboard text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "px-1.5 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                                                                ev.impact === "HIGH" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                                                            )}>
                                                                {ev.currency} • {ev.impact}
                                                            </span>
                                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{ev.title}</span>
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

                                    {/* Strategy / Playbook Benchmark Panel */}
                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-4 rounded-lg border border-dashboard space-y-2.5 sm:space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                {currentStrategy?.isPlaybook ? (
                                                    <BookOpen size={14} className="text-primary" />
                                                ) : (
                                                    <Target size={14} className="text-amber-600 dark:text-gold" />
                                                )}
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {currentStrategy?.isPlaybook ? "Playbook Setup" : "Strategy"}
                                                </h4>
                                            </div>

                                            {/* Grade badge */}
                                            {entry.playbookGrade && (
                                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
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
                                                    className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1.5"
                                                    style={{
                                                        backgroundColor: `${strategyColor}15`,
                                                        color: strategyColor,
                                                        borderColor: `${strategyColor}30`,
                                                    }}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: strategyColor }} />
                                                    {currentStrategy?.name || entry.strategy}
                                                </span>

                                                {currentStrategy?.setupType && (
                                                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold">
                                                        {currentStrategy.setupType}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                No strategy selected
                                            </span>
                                        )}

                                        {/* Playbook Benchmark Details */}
                                        {currentStrategy?.isPlaybook && (
                                            <div className="pt-2 border-t border-dashboard/50 space-y-2.5">
                                                {/* Ideal Specs */}
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                                            {entry.entryReason && (
                                                <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-4 rounded-lg border border-dashboard">
                                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-2">
                                                        <MessageSquare
                                                            size={12}
                                                            className="text-amber-600 dark:text-gold"
                                                        />{" "}
                                                        Entry Reason
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {entry.entryReason}
                                                    </p>
                                                </div>
                                            )}
                                            {entry.exitReason && (
                                                <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-4 rounded-lg border border-dashboard">
                                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-2">
                                                        <MessageSquare
                                                            size={12}
                                                            className="text-amber-600 dark:text-gold"
                                                        />{" "}
                                                        Exit Reason
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {entry.exitReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Psychological State - Full Width */}
                                    <div className="bg-gray-50/80 dark:bg-[#151925] p-3 sm:p-4 rounded-lg border border-dashboard relative overflow-hidden">
                                        <div className="absolute -bottom-6 -right-6 text-gold/5 -rotate-12 pointer-events-none">
                                            <Brain size={120} strokeWidth={1} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-2 relative z-10">
                                            <Brain
                                                size={12}
                                                className="text-amber-600 dark:text-gold"
                                            />{" "}
                                            Psychological State
                                        </h4>
                                        <div className="relative z-10">
                                            {entry.emotionBefore ||
                                            entry.emotionAfter ||
                                            entry.confidenceLevel ? (
                                                <div className="space-y-2.5 sm:space-y-3">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                        {entry.emotionBefore && (
                                                            <span className="px-2.5 py-1 sm:px-4 sm:py-2 bg-gold/10 text-amber-600 dark:text-gold rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider border border-gold/20">
                                                                Before:{" "}
                                                                {entry.emotionBefore}
                                                            </span>
                                                        )}
                                                        {entry.emotionAfter && (
                                                            <span className="px-2.5 py-1 sm:px-4 sm:py-2 bg-gold/10 text-amber-600 dark:text-gold rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider border border-gold/20">
                                                                After:{" "}
                                                                {entry.emotionAfter}
                                                            </span>
                                                        )}
                                                        {entry.confidenceLevel && (
                                                            <span className="px-2.5 py-1 sm:px-4 sm:py-2 bg-amber-500/10 text-amber-600 dark:text-gold rounded-lg text-[11px] sm:text-xs font-mono tabular-nums font-black uppercase tracking-wider border border-amber-500/20">
                                                                Confidence:{" "}
                                                                {entry.confidenceLevel}
                                                                /5
                                                            </span>
                                                        )}
                                                        {entry.followedPlan !== null &&
                                                            entry.followedPlan !== undefined && (
                                                                <span
                                                                    className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider border ${
                                                                        entry.followedPlan
                                                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                                                    }`}
                                                                >
                                                                    {entry.followedPlan
                                                                        ? (<><Check size={12} className="inline-block mr-1 align-[-1px]" /> Followed Plan</>)
                                                                        : (<><X size={12} className="inline-block mr-1 align-[-1px]" /> Deviated</>)}
                                                                </span>
                                                            )}
                                                    </div>
                                                    {entry.notesPsychology && (
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gold/30 pl-3">
                                                            {entry.notesPsychology}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-1 sm:py-2">
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
                                    <div className="pt-3.5 sm:pt-5 border-t border-dashboard">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-2">
                                            <Tag
                                                size={12}
                                                className="text-primary"
                                            />{" "}
                                            Filtering Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {entry.tags &&
                                            entry.tags.length > 0 ? (
                                                entry.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2.5 py-1 sm:px-4 sm:py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-dashboard hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-default"
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
                                    <div className="pt-3.5 sm:pt-5 border-t border-dashboard">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-2">
                                            <ShieldAlert
                                                size={12}
                                                className="text-red-500"
                                            />{" "}
                                            Execution Flaws
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                                                                className="px-2.5 py-1 sm:px-4 sm:py-2 bg-red-500/10 text-red-500 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider border border-red-500/20 flex items-center gap-1.5 sm:gap-2"
                                                            >
                                                                <ShieldAlert size={13} className="shrink-0" />
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
                                                <div className="w-full p-3 sm:p-4 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-center gap-2.5 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                                                        <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs sm:text-base font-bold text-gray-700 dark:text-white">
                                                            Flawless Execution
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
                                className="mt-3 sm:mt-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            >
                                <div className="pt-0 sm:pt-2">
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
                        <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-6 rounded-xl border border-dashboard">
                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-3 bg-gold rounded-full"></div>
                                Trade Screenshots
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
