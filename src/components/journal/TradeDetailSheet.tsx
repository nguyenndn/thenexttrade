"use client"

import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { ShareTradeModal } from "./ShareTradeModal"
import { Share2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, Info, DollarSign, Tag, Brain, BarChart3, MessageSquare, AlertTriangle, X, Medal, Target, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/Sheet"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { getMistakeByCode } from "@/lib/mistakes"
import { EmptyState } from "@/components/ui/EmptyState"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { transformImageUrl } from "@/lib/utils"


interface JournalEntry {
    id: string;
    entryDate: string;
    exitDate: string | null;
    symbol: string;
    type: "BUY" | "SELL";
    pnl: number | null;
    status: "OPEN" | "CLOSED";
    result: "WIN" | "LOSS" | "BREAK_EVEN" | null;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
    strategy: string | null;
    tags: string[];
    mistakes: string[];
    emotionBefore: string | null;
    accountId: string | null;
    notes?: string;
    mindset?: string;
    images?: string[];
}

interface TradeDetailSheetProps {
    entry: JournalEntry | null;
    strategies?: any[];
    isOpen: boolean;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

export function TradeDetailSheet({ entry, strategies = [], isOpen, onClose, onNext, onPrev, hasNext, hasPrev }: TradeDetailSheetProps) {
    const [showShareModal, setShowShareModal] = useState(false);

    if (!entry) return null;

    const isWin = entry.pnl && entry.pnl > 0;
    const pnlColor = entry.pnl && entry.pnl > 0 ? "text-primary" : entry.pnl && entry.pnl < 0 ? "text-red-500" : "text-gray-500";
    const typeColor = entry.type === "BUY" ? "bg-blue-500" : "bg-red-500";
    const statusColor = entry.status === "OPEN" ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/20 text-gray-500";

    const currentStrategy = entry.strategy ? strategies.find(s => s.name === entry.strategy || s.id === entry.strategy) : null;
    const strategyColor = currentStrategy?.color || "#6B7280";

    // Hit Logic calculations (only if trade is closed)
    const isBuy = entry.type === "BUY";
    const isTPHit = entry.status === "CLOSED" && entry.exitPrice && entry.takeProfit ? 
        (isBuy ? entry.exitPrice >= entry.takeProfit : entry.exitPrice <= entry.takeProfit) : false;
        
    const isSLHit = entry.status === "CLOSED" && entry.exitPrice && entry.stopLoss ? 
        (isBuy ? entry.exitPrice <= entry.stopLoss : entry.exitPrice >= entry.stopLoss) : false;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            {/* Main Sheet Container - Dark Mode BG #0F1117 */}
            <SheetContent className="sm:max-w-4xl p-0 gap-0 bg-gray-50 dark:bg-[#0F1117] border-l border-gray-200 dark:border-white/10 overflow-y-auto">
                {/* 
                  A11y Requirement: Radix DialogContent requires a DialogTitle. 
                  Since we build our own visual header below, we hide the official one for screen readers.
                */}
                <VisuallyHidden>
                    <SheetHeader>
                        <SheetTitle>Trade Details</SheetTitle>
                        <SheetDescription>View metrics, analysis, and screenshots for this trade.</SheetDescription>
                    </SheetHeader>
                </VisuallyHidden>

                {/* Header Section */}
                <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-[#0F1117]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Trade Details
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowShareModal(true)}
                                className="bg-primary hover:bg-[#00a872] text-white shadow-lg shadow-primary/30 rounded-xl px-5 font-bold flex items-center gap-2 transition-all border-none h-10"
                            >
                                <Share2 size={18} strokeWidth={2.5} />
                                Share
                            </Button>
                            <SheetClose className="rounded-xl h-10 w-10 p-0 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white transition-colors">
                                <X size={20} />
                            </SheetClose>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Hero Card - Premium Glass/Glow Effect */}
                    <div className="relative bg-white dark:bg-[#1E2028] rounded-xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            {/* Left: Symbol & Type */}
                            <div className="flex items-center gap-6">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onPrev}
                                    disabled={!hasPrev}
                                    className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={24} />
                                </Button>

                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                            {entry.symbol}
                                        </h1>
                                        <span className={cn("px-3 py-1.5 rounded-lg text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-blue-500/20", typeColor)}>
                                            {entry.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-mono text-sm md:text-base font-bold">
                                        <span>{entry.entryPrice}</span>
                                        <span className="text-gray-300 dark:text-white/20">➜</span>
                                        <span className={isWin ? "text-primary" : entry.pnl && entry.pnl < 0 ? "text-red-500" : ""}>
                                            {entry.exitPrice || "???"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: PnL Big Number */}
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className={cn("text-4xl md:text-5xl font-black tracking-tighter flex items-center justify-end gap-2", pnlColor)}>
                                        {isWin ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                                        {entry.pnl?.toFixed(2) || "0.00"}
                                    </div>
                                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2">
                                        {entry.pnl ? ((entry.pnl / 10000) * 100).toFixed(2) : "0.00"}% Gain
                                    </div>
                                </div>

                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={onNext}
                                    disabled={!hasNext}
                                    className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={24} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="metrics" className="w-full">
                        <TabsList className="bg-gray-200/50 dark:bg-[#151925] p-1.5 rounded-xl w-full sm:w-auto inline-flex h-auto mb-8">
                            <TabsTrigger
                                value="metrics"
                                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F80ED] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-lg shadow-blue-500/20 transition-all text-gray-500 dark:text-gray-400"
                            >
                                <BarChart3 size={16} className="mr-2" />
                                Trade Metrics
                            </TabsTrigger>
                            <TabsTrigger
                                value="tags"
                                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F80ED] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-lg shadow-blue-500/20 transition-all text-gray-500 dark:text-gray-400"
                            >
                                <Tag size={16} className="mr-2" />
                                Trade Tags
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="metrics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Unified Performance Card - Premium Grid Layout */}
                            <div className="space-y-6 pt-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2 pl-2">
                                    <BarChart3 size={14} />
                                    Performance Summary
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
                                    {/* Ambient Glow based on Result */}
                                    <div className={cn(
                                        "absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20 transition-all duration-700", 
                                        isWin ? "bg-green-500 group-hover:opacity-30" : "bg-red-500 group-hover:opacity-30"
                                    )}></div>

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-white/5">
                                        
                                        {/* Left Column: Trade Info & Costs */}
                                        <div className="p-8 space-y-8">
                                            {/* Trade Information */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Clock size={12} className="text-primary" /> Trade Journey
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Volume</span>
                                                        <span className="text-sm font-black text-gray-900 dark:text-white font-mono">{entry.lotSize} Lots</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Open</span>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            {format(new Date(entry.entryDate), "MMM dd, HH:mm")}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Close</span>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            {entry.exitDate ? format(new Date(entry.exitDate), "MMM dd, HH:mm") : "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction Costs */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <DollarSign size={12} className="text-yellow-500" /> Transaction Fees
                                                </h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Commission</span>
                                                        <span className="text-xs font-black text-gray-900 dark:text-white font-mono">0.00</span>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Swap</span>
                                                        <span className="text-xs font-black text-gray-900 dark:text-white font-mono">0.00</span>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Fee</span>
                                                        <span className="text-xs font-black text-gray-900 dark:text-white font-mono">0.00</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Price & Results */}
                                        <div className="p-8 space-y-8 bg-gray-50/30 dark:bg-white/[0.01]">
                                            {/* Price Summary */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <TrendingUp size={12} className={cn(isWin ? "text-green-500" : "text-red-500")} /> Price Execution
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Entry Price</span>
                                                        <span className="text-lg font-black text-gray-900 dark:text-white font-mono">{entry.entryPrice}</span>
                                                    </div>
                                                    <div className="relative bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                                                            Exit Price
                                                            {isTPHit && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-sm animate-pulse tracking-widest font-black shadow-sm shadow-green-500/20">🎯 TP HIT</span>}
                                                            {isSLHit && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-sm animate-pulse tracking-widest font-black shadow-sm shadow-red-500/20">🛡️ SL HIT</span>}
                                                        </span>
                                                        <span className={cn("text-lg font-black font-mono", isTPHit ? "text-green-500" : isSLHit ? "text-red-500" : "text-gray-900 dark:text-white")}>
                                                            {entry.exitPrice || "---"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm opacity-80">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Stop Loss</span>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">{entry.stopLoss || "---"}</span>
                                                    </div>
                                                    <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm opacity-80">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Take Profit</span>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">{entry.takeProfit || "---"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trade Results Hub */}
                                            <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-inner relative overflow-hidden">
                                                <div className={cn("absolute inset-0 opacity-[0.03] pattern-diagonal-lines pattern-size-4 pattern-bg-white", isWin ? "pattern-green-500" : "pattern-red-500")}></div>
                                                
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 relative z-10 flex items-center gap-2">
                                                    <Medal size={12} className={pnlColor} /> Final Outcome
                                                </h4>
                                                
                                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Gross Profit</span>
                                                        <span className={cn("text-xl font-black font-mono", pnlColor)}>
                                                            {entry.pnl?.toFixed(2) || "0.00"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Percent Gain</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("text-xl font-black font-mono", pnlColor)}>
                                                                {entry.pnl ? ((entry.pnl / 10000) * 100).toFixed(2) : "0.00"}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-white/10">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Net Profit</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn("text-4xl font-black font-mono tracking-tighter", pnlColor)}>
                                                                {isWin ? "+" : ""}{entry.pnl?.toFixed(2) || "0.00"}
                                                            </span>
                                                            {isWin && (
                                                                <span className="bg-green-500/10 text-green-500 p-2 rounded-xl animate-bounce shadow-lg shadow-green-500/20">
                                                                    <TrendingUp size={20} />
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

                        <TabsContent value="tags" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Unified Analysis Card - Premium Grid Layout */}
                            <div className="space-y-6 pt-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2 pl-2">
                                    <Brain size={14} />
                                    Trade Analysis & Context
                                </h3>

                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl p-8 space-y-8">
                                    {/* Strategy & Psychology */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-gray-50/50 dark:bg-white/[0.02] p-6 rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden">
                                            <div className="absolute -top-10 -right-10 text-blue-500/5 rotate-12 pointer-events-none">
                                                <Target size={120} strokeWidth={1} />
                                            </div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                                                <Target size={12} className="text-blue-500" /> Strategy Executed
                                            </h4>
                                            <div className="relative z-10">
                                                {entry.strategy ? (
                                                    <span
                                                        className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider border"
                                                        style={{
                                                            backgroundColor: `${strategyColor}15`,
                                                            color: strategyColor,
                                                            borderColor: `${strategyColor}30`
                                                        }}
                                                    >
                                                        {currentStrategy?.name || entry.strategy}
                                                    </span>
                                                ) : (
                                                    <div className="py-2">
                                                         <EmptyState 
                                                            icon={Target} 
                                                            title="No Strategy Selected" 
                                                            description="This trade was logged without a specific system."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 dark:bg-white/[0.02] p-6 rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden">
                                            <div className="absolute -bottom-6 -right-6 text-purple-500/5 -rotate-12 pointer-events-none">
                                                <Brain size={120} strokeWidth={1} />
                                            </div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                                                <Brain size={12} className="text-purple-500" /> Psychological State
                                            </h4>
                                            <div className="relative z-10">
                                                {entry.mindset ? (
                                                    <span className="px-5 py-2.5 bg-purple-500/10 text-purple-500 rounded-xl text-sm font-black uppercase tracking-wider border border-purple-500/20 shadow-inner">
                                                        {entry.mindset}
                                                    </span>
                                                ) : (
                                                    <div className="py-2">
                                                         <EmptyState 
                                                            icon={Brain} 
                                                            title="Mindset Not Recorded" 
                                                            description="Emotion tracking was skipped for this execution."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Tags */}
                                    <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Tag size={12} className="text-primary" /> Filtering Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {entry.tags && entry.tags.length > 0 ? entry.tags.map(tag => (
                                                <span key={tag} className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-default">
                                                    {tag}
                                                </span>
                                            )) : (
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
                                    <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <ShieldAlert size={12} className="text-red-500" /> Execution Flaws
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {entry.mistakes && entry.mistakes.length > 0 ? entry.mistakes.map(mistakeCode => {
                                                const mistake = getMistakeByCode(mistakeCode);
                                                return (
                                                    <span key={mistakeCode} className="px-5 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-wider border border-red-500/20 flex items-center gap-2">
                                                        {mistake ? (
                                                            <>
                                                                <span className="text-base">{mistake.emoji}</span>
                                                                <span>{mistake.name}</span>
                                                            </>
                                                        ) : (
                                                            mistakeCode
                                                        )}
                                                    </span>
                                                )
                                            }) : (
                                                <div className="w-full p-6 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                                        <Medal size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">Flawless Execution</p>
                                                        <p className="text-sm text-gray-500">No trading mistakes were recorded for this entry.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Screenshots - Always visible at bottom */}
                    {entry.images && entry.images.length > 0 && (
                        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-3 bg-pink-500 rounded-full"></div>
                                Trade Screenshots
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {entry.images.map((rawImg, idx) => {
                                    const img = transformImageUrl(rawImg);
                                    return (
                                        <a
                                            key={idx}
                                            href={img}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group hover:ring-2 ring-primary transition-all"
                                        >
                                            <img
                                                src={img}
                                            alt={`Trade Screenshot ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <div className="bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                View Full Size
                                            </div>
                                            </div>
                                        </a>
                                    );
                                })}
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
        </Sheet>
    )
}
