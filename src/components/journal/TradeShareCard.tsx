"use client";


import { Medal, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradingViewMiniChart } from "./TradingViewMiniChart";

interface TradeShareCardProps {
    entry: any; // Using any for simplicity with existing JournalEntry type
    variant: "basic" | "full";
    className?: string;
}

export function TradeShareCard({ entry, variant, className }: TradeShareCardProps) {
    if (!entry) return null;

    const isWin = entry.pnl && entry.pnl > 0;
    
    // Hit logic
    const isBuy = entry.type === "BUY";
    const isTPHit = entry.status === "CLOSED" && entry.exitPrice && entry.takeProfit ? 
        (isBuy ? entry.exitPrice >= entry.takeProfit : entry.exitPrice <= entry.takeProfit) : false;
    const isSLHit = entry.status === "CLOSED" && entry.exitPrice && entry.stopLoss ? 
        (isBuy ? entry.exitPrice <= entry.stopLoss : entry.exitPrice >= entry.stopLoss) : false;

    // Theme Colors based on Result
    const themeColor = isWin ? "#22c55e" : "#ef4444"; // Green-500 : Red-500
    const bgGradient = isWin ? "from-green-500/10 to-transparent" : "from-red-500/10 to-transparent";
    const textColor = isWin ? "text-green-500" : "text-red-500";
    const badgeBg = isWin ? "bg-green-500" : "bg-red-500";

    const percentGain = entry.pnl ? ((entry.pnl / 10000) * 100).toFixed(2) : "0.00";

    return (
        <div className={cn("relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white dark:bg-[#1E2028] shadow-2xl border border-gray-200 dark:border-white/10 transition-all text-left", className)}>
            {/* Background Texture/Gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", bgGradient)}></div>
            
            <div className="relative z-10 flex flex-col md:flex-row h-full">
                {/* LEFT COLUMN: Trade Stats */}
                <div className={cn("flex-1 p-6 md:p-8 flex flex-col justify-between", variant === "full" ? "md:max-w-[40%]" : "w-full")}>
                    <div>
                        {/* Header: Logo & Badge */}
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-2xl tracking-tighter">
                                    <span className="text-gray-700 dark:text-white">TheNext</span>
                                    <span className="text-primary">Trade</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {entry.account?.accountType && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        entry.account.accountType === "DEMO"
                                            ? "border-amber-400/40 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
                                            : "border-emerald-400/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    )}>
                                        {entry.account.accountType === "DEMO" ? "Demo" : "Real"}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase tracking-widest bg-blue-500/5">
                                    <ShieldCheck size={10} strokeWidth={3} />
                                    Verified
                                </span>
                            </div>
                        </div>

                        {/* Trade Header */}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex-wrap">
                            <span className={cn("px-2 py-0.5 rounded text-white", badgeBg)}>{entry.type}</span>
                            <span>|</span>
                            <span>{Number(entry.lotSize)} Lots</span>
                            <span>|</span>
                            <span>{entry.symbol}</span>
                        </div>

                        {/* Big PnL */}
                        <div className={cn("text-4xl md:text-6xl font-black tracking-tighter mb-6 md:mb-8", textColor)}>
                            {entry.pnl && entry.pnl > 0 ? "+" : ""}${Math.abs(entry.pnl).toFixed(2)}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/10">
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Entry Price</span>
                            <span className="font-black text-gray-700 dark:text-white font-mono">{Number(entry.entryPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/10">
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Exit Price</span>
                            <div className="flex items-center gap-2">
                                {isTPHit && (
                                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                                        🎯 TP HIT
                                    </span>
                                )}
                                {isSLHit && (
                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                                        🛡️ SL HIT
                                    </span>
                                )}
                                <span className="font-black text-gray-700 dark:text-white font-mono">{Number(entry.exitPrice || 0)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Gain</span>
                            <span className={cn("font-black text-lg", textColor)}>{percentGain}%</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: TradingView Chart (Full Mode Only) */}
                {variant === "full" && (
                    <div className="relative flex-1 bg-gray-50 dark:bg-black/20 min-h-[250px] md:min-h-[300px] border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 flex flex-col justify-end overflow-hidden">
                        
                        {/* Premium Grid Pattern Background */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" 
                             style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>

                        {/* Watermark / Brand in Chart */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-50 z-20">
                            <Medal size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-500">Verified by TheNextTrade</span>
                        </div>

                        {/* TradingView Lightweight Chart */}
                        <div className="absolute inset-0 pt-10 pb-2 px-2">
                            <TradingViewMiniChart
                                entryPrice={Number(entry.entryPrice)}
                                exitPrice={Number(entry.exitPrice || entry.entryPrice)}
                                entryDate={entry.entryDate}
                                exitDate={entry.exitDate}
                                stopLoss={entry.stopLoss ? Number(entry.stopLoss) : null}
                                takeProfit={entry.takeProfit ? Number(entry.takeProfit) : null}
                                type={entry.type}
                                isWin={!!isWin}
                                tradeId={entry.id || "default"}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
