"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, ReferenceDot } from "recharts";
import { TrendingUp, TrendingDown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeShareCardProps {
    entry: any; // Using any for simplicity with existing JournalEntry type
    variant: "basic" | "full";
    className?: string;
}

export function TradeShareCard({ entry, variant, className }: TradeShareCardProps) {
    if (!entry) return null;

    const isWin = entry.pnl && entry.pnl > 0;
    
    // Theme Colors based on Result
    const themeColor = isWin ? "#22c55e" : "#ef4444"; // Green-500 : Red-500
    const gradientId = isWin ? "gradientWin" : "gradientLoss";
    const bgGradient = isWin ? "from-green-500/10 to-transparent" : "from-red-500/10 to-transparent";
    const textColor = isWin ? "text-green-500" : "text-red-500";
    const badgeBg = isWin ? "bg-green-500" : "bg-red-500";

    // Generate Stylized Chart Data
    const { data: chartData, min, max } = useMemo(() => {
        if (!entry.entryPrice || !entry.exitPrice) return { data: [], min: 0, max: 0 };

        const points = 10; // Reduce points for smoother, less jagged look
        const startPrice = Number(entry.entryPrice);
        const endPrice = Number(entry.exitPrice);
        
        // Calculate volatility
        const priceDiff = Math.abs(startPrice - endPrice);
        const basePrice = startPrice;
        const minVolatility = basePrice * 0.0005; 
        const volatility = Math.max(priceDiff, minVolatility) * 0.5;

        let minVal = Math.min(startPrice, endPrice);
        let maxVal = Math.max(startPrice, endPrice);

        const data = Array.from({ length: points }).map((_, i) => {
            const progress = i / (points - 1);
            let price = startPrice + (endPrice - startPrice) * progress;
            
            if (i > 0 && i < points - 1) {
                // Smoother wave, less random jitter
                const noise = (Math.random() - 0.5) * volatility * 0.5;
                const wave = Math.sin(progress * Math.PI) * (volatility * 0.3); 
                price += noise + wave;
            }

            minVal = Math.min(minVal, price);
            maxVal = Math.max(maxVal, price);

            return { index: i, value: price };
        });
        
        const padding = (maxVal - minVal) * 0.2 || minVolatility;

        return { 
            data, 
            min: minVal - padding, 
            max: maxVal + padding 
        };
    }, [entry.entryPrice, entry.exitPrice]);

    const percentGain = entry.pnl ? ((entry.pnl / 10000) * 100).toFixed(2) : "0.00";

    return (
        <div className={cn("relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden bg-white dark:bg-[#1E2028] shadow-2xl border border-gray-100 dark:border-white/5 transition-all text-left", className)}>
            {/* Background Texture/Gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", bgGradient)}></div>
            
            <div className="relative z-10 flex flex-col md:flex-row h-full">
                {/* LEFT COLUMN: Trade Stats */}
                <div className={cn("flex-1 p-6 md:p-8 flex flex-col justify-between", variant === "full" ? "md:max-w-[40%]" : "w-full")}>
                    <div>
                        {/* Header: Logo & Badge */}
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/30">
                                    G
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white tracking-tight">GSN Trading</span>
                            </div>
                            <span className="px-3 py-1 rounded-full border border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest bg-blue-500/5">
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
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Entry Price</span>
                            <span className="font-black text-gray-900 dark:text-white font-mono">{Number(entry.entryPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Exit Price</span>
                            <span className="font-black text-gray-900 dark:text-white font-mono">{Number(entry.exitPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Gain</span>
                            <span className={cn("font-black text-lg", textColor)}>{percentGain}%</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Chart (Full Mode Only) */}
                {variant === "full" && (
                    <div className="flex-1 relative bg-gray-50 dark:bg-black/20 min-h-[250px] md:min-h-[300px] border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 p-6 flex flex-col justify-end">
                        {/* Watermark / Brand in Chart */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-50 z-20">
                            <Medal size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-400">Verified by GSN</span>
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
                                    {/* Entry Point Marker */}
                                    <ReferenceDot 
                                        x={0} 
                                        y={Number(entry.entryPrice)} 
                                        r={4} 
                                        fill={themeColor} 
                                        stroke="white" 
                                        strokeWidth={2}
                                    />

                                    {/* Exit Point Marker */}
                                    <ReferenceDot 
                                        x={9} 
                                        y={Number(entry.exitPrice)} 
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

