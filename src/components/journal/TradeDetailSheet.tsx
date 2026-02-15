"use client"

import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { ShareTradeModal } from "./ShareTradeModal"
import { Share2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, Info, DollarSign, Tag, Brain, BarChart3, MessageSquare, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/Sheet"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { getMistakeByCode } from "@/lib/mistakes"


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
}

export function TradeDetailSheet({ entry, strategies = [], isOpen, onClose }: TradeDetailSheetProps) {
    const [showShareModal, setShowShareModal] = useState(false);

    if (!entry) return null;

    const isWin = entry.pnl && entry.pnl > 0;
    const pnlColor = entry.pnl && entry.pnl > 0 ? "text-primary" : entry.pnl && entry.pnl < 0 ? "text-red-500" : "text-gray-500";
    const typeColor = entry.type === "BUY" ? "bg-blue-500" : "bg-red-500";
    const statusColor = entry.status === "OPEN" ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/20 text-gray-500";

    const currentStrategy = entry.strategy ? strategies.find(s => s.name === entry.strategy || s.id === entry.strategy) : null;
    const strategyColor = currentStrategy?.color || "#6B7280";

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            {/* Main Sheet Container - Dark Mode BG #0F1117 */}
            <SheetContent className="sm:max-w-4xl p-0 gap-0 bg-gray-50 dark:bg-[#0F1117] border-l border-gray-200 dark:border-white/5 overflow-y-auto">

                {/* Header Section */}
                <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-[#0F1117]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Trade Details
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowShareModal(true)}
                                className="bg-primary hover:bg-[#00a872] text-white shadow-lg shadow-primary/30 rounded-xl px-5 font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all border-none h-10"
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
                    <div className="relative bg-white dark:bg-[#1E2028] rounded-xl p-8 md:p-10 shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            {/* Left: Symbol & Type */}
                            <div className="flex items-center gap-6">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
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

                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
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
                            {/* Unified Performance Card - Minimalist */}
                            <div className="space-y-8 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2 pl-2">
                                    <BarChart3 size={14} />
                                    Performance Summary
                                </h3>

                                <div className="space-y-12">
                                    {/* Group 1: Trade Information */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                            Trade Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Volume</p>
                                                <p className="text-base font-black text-gray-900 dark:text-white">{entry.lotSize} Lots</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Open Time</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {format(new Date(entry.entryDate), "MMM dd, HH:mm")}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Close Time</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {entry.exitDate ? format(new Date(entry.exitDate), "MMM dd, HH:mm") : "---"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group 2: Price Summary */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                            Price Summary
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Open Price</p>
                                                <p className="text-base font-black text-gray-900 dark:text-white font-mono">{entry.entryPrice}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Close Price</p>
                                                <p className="text-base font-black text-gray-900 dark:text-white font-mono">{entry.exitPrice || "???"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group 3: Transaction Costs */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                            Transaction Costs
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Commission</p>
                                                <p className="text-base font-bold text-gray-900 dark:text-white font-mono">0.00</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Swap</p>
                                                <p className="text-base font-bold text-gray-900 dark:text-white font-mono">0.00</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Fee</p>
                                                <p className="text-base font-bold text-gray-900 dark:text-white font-mono">0.00</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group 4: Trade Results */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
                                        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none", isWin ? "bg-green-500" : "bg-red-500")}></div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2 relative z-10">
                                            Trade Results
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Gross Profit</p>
                                                <p className={cn("text-lg font-black font-mono", pnlColor)}>
                                                    {entry.pnl?.toFixed(2) || "0.00"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Net Profit</p>
                                                <div className="flex items-center gap-2">
                                                    <p className={cn("text-xl font-black font-mono", pnlColor)}>
                                                        {entry.pnl?.toFixed(2) || "0.00"}
                                                    </p>
                                                    {isWin && <span className="bg-primary/10 text-primary p-1 rounded-full"><TrendingUp size={12} /></span>}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold mb-1">Percent Gain</p>
                                                <p className={cn("text-lg font-black font-mono", pnlColor)}>
                                                    {entry.pnl ? ((entry.pnl / 10000) * 100).toFixed(2) : "0.00"}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="tags" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Unified Analysis Card - Minimalist */}
                            <div className="space-y-8 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2 pl-2">
                                    <Brain size={14} />
                                    Trade Analysis & Context
                                </h3>

                                <div className="space-y-6">
                                    {/* Strategy & Psychology */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <TrendingUp size={12} /> Strategy
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
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
                                                ) : <p className="text-sm text-gray-400 font-medium italic">No strategy selected</p>}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Brain size={12} /> Psychology
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {entry.mindset ? (
                                                    <span className="px-5 py-2.5 bg-purple-500/10 text-purple-500 rounded-xl text-sm font-black uppercase tracking-wider border border-purple-500/20">
                                                        {entry.mindset}
                                                    </span>
                                                ) : <p className="text-sm text-gray-400 font-medium italic">No mindset recorded</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Tags */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Tag size={12} /> Custom Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {entry.tags && entry.tags.length > 0 ? entry.tags.map(tag => (
                                                <span key={tag} className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-default">
                                                    {tag}
                                                </span>
                                            )) : <p className="text-sm text-gray-400 font-medium italic">No custom tags added</p>}
                                        </div>
                                    </div>

                                    {/* Mistakes */}
                                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertTriangle size={12} /> Mistakes & Errors
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
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
                                            }) : <p className="text-sm text-gray-400 font-medium italic flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                Clean trade! No mistakes recorded.
                                            </p>}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Screenshots - Always visible at bottom */}
                    {entry.images && entry.images.length > 0 && (
                        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-3 bg-pink-500 rounded-full"></div>
                                Trade Screenshots
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {entry.images.map((img, idx) => (
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
        </Sheet>
    )
}
