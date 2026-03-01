"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, ReferenceDot } from "recharts";
import { TrendingUp, TrendingDown, Medal, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const gradientId = isWin ? "gradientWin" : "gradientLoss";
    const bgGradient = isWin ? "from-green-500/10 to-transparent" : "from-red-500/10 to-transparent";
    const textColor = isWin ? "text-green-500" : "text-red-500";
    const badgeBg = isWin ? "bg-green-500" : "bg-red-500";

    // Generate Stylized Chart Data (PnL Progression) - Static Hash logic to prevent jumping
    const { data: chartData, min, max } = useMemo(() => {
        if (entry.pnl === undefined || entry.pnl === null) return { data: [], min: 0, max: 0 };

        const points = 10;
        const startPnL = 0;
        const endPnL = Number(entry.pnl);
        const volatility = Math.abs(endPnL) * 0.4;
        
        let minVal = Math.min(startPnL, endPnL);
        let maxVal = Math.max(startPnL, endPnL);

        // Simple pseudo-random generator based on ID or string to keep chart consistent per trade
        const seedStr = `${entry.id || 'default'}-${endPnL}`;
        const hash = Array.from(seedStr).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const pseudoRandom = (seed: number) => {
            const x = Math.sin(seed + hash) * 10000;
            return x - Math.floor(x);
        };

        const data = Array.from({ length: points }).map((_, i) => {
            const progress = i / (points - 1);
            const easedProgress = Math.pow(progress, 1.5); 
            let pnl = startPnL + (endPnL - startPnL) * easedProgress;
            
            if (i > 0 && i < points - 1) {
                // Static noise logic instead of Math.random()
                const noise = (pseudoRandom(i) - 0.5) * volatility * 0.3;
                const wave = Math.sin(progress * Math.PI) * (volatility * 0.5); 
                pnl += isWin ? (noise - wave * 0.5) : (noise + wave * 0.5);
            }

            minVal = Math.min(minVal, pnl);
            maxVal = Math.max(maxVal, pnl);

            return { index: i, value: pnl };
        });
        
        const padding = Math.abs(maxVal - minVal) * 0.2 || 1;

        return { 
            data, 
            min: minVal - padding, 
            max: maxVal + padding 
        };
    }, [entry.pnl, isWin]);

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
                                    <span className="text-gray-900 dark:text-white">The</span>
                                    <span className="text-gray-900 dark:text-white">Next</span>
                                    <span className="text-primary">Trade</span>
                                </span>
                            </div>
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest bg-blue-500/5">
                                <ShieldCheck size={12} strokeWidth={3} />
                                Verified
                            </span>
                        </div>

                        {/* Trade Header */}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
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
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Entry Price</span>
                            <span className="font-black text-gray-900 dark:text-white font-mono">{Number(entry.entryPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/10">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Exit Price</span>
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
                                <span className="font-black text-gray-900 dark:text-white font-mono">{Number(entry.exitPrice || 0)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Gain</span>
                            <span className={cn("font-black text-lg", textColor)}>{percentGain}%</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Chart (Full Mode Only) */}
                {variant === "full" && (
                    <div className="relative flex-1 bg-gray-50 dark:bg-black/20 min-h-[250px] md:min-h-[300px] border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 flex flex-col justify-end overflow-hidden">
                        
                        {/* Premium Grid Pattern Background */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" 
                             style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>

                        {/* Watermark / Brand in Chart */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-50 z-20">
                            <Medal size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-400">Verified by TheNextTrade</span>
                        </div>

                        {/* Chart */}
                        <div className="absolute inset-0 pt-12 pb-0 px-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={themeColor} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="index" type="number" domain={[0, 9]} hide />
                                    <YAxis hide domain={[min, max]} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={themeColor} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill={`url(#${gradientId})`}
                                        isAnimationActive={false} // Smooth rendering
                                    />
                                    {/* Entry Point Marker (0 PnL) */}
                                    <ReferenceDot 
                                        x={0} 
                                        y={0} 
                                        r={4} 
                                        fill={themeColor} 
                                        stroke="white" 
                                        strokeWidth={2}
                                    />

                                    {/* Exit Point Marker (Final PnL) */}
                                    <ReferenceDot 
                                        x={9} 
                                        y={Number(entry.pnl || 0)} 
                                        r={4} 
                                        fill={themeColor} 
                                        stroke="white" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Label Component
const CustomLabel = (props: any) => {
    const { x, y, text, color, viewBox, position } = props;
    
    // Y Logic: Flip based on position (Top/Bottom) to keep inside
    const isTopHalf = y < (viewBox.height / 2);
    const labelY = isTopHalf ? y + 20 : y - 20; 

    // X Logic: Shift based on position (Start/End) to keep inside
    // Increased shift to 32px to ensure full visibility inside margins
    let labelX = x;
    if (position === "start") labelX = x + 32; 
    if (position === "end") labelX = x - 32;   

    return (
        <g transform={`translate(${labelX},${labelY})`}>
            <rect 
                x={-24} 
                y={-10} 
                width={48} 
                height={20} 
                rx={4} 
                fill="white" 
                className="dark:fill-[#1E2028]" 
                stroke={color}
                strokeWidth={1}
            />
            <text 
                x={0} 
                y={4} 
                textAnchor="middle" 
                className="text-[10px] font-bold fill-gray-500 dark:fill-gray-300"
                style={{ fontSize: '10px' }}
            >
                {text}
            </text>
        </g>
    );
};

