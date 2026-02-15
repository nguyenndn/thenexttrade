"use client";

// import Image from "next/image"; 
import { TrendingUp, TrendingDown, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { TradeTypeBadge } from "@/components/ui/TradeTypeBadge";
import { PnLDisplay } from "@/components/ui/PnLDisplay";

interface PlaybookCardProps {
    trade: {
        id: string;
        symbol: string;
        type: "BUY" | "SELL";
        pnl: number | null;
        entryDate: string | Date;
        images: string[];
    };
    onClick: () => void;
}

export function PlaybookCard({ trade, onClick }: PlaybookCardProps) {
    const isWin = (trade.pnl || 0) > 0;
    const isLoss = (trade.pnl || 0) < 0;
    const formattedDate = new Date(trade.entryDate);

    // Placeholder if image fails or is missing, though parent should filter empty images
    const imageUrl = trade.images[0] || "/placeholder-chart.png";

    return (
        <div
            className="group relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer border border-gray-100 dark:border-white/5 bg-gray-100 dark:bg-[#1E2028] transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            onClick={onClick}
        >
            {/* Image */}
            <div className="absolute inset-0">
                <img
                    src={imageUrl}
                    alt={`${trade.symbol} Trade`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=No+Image";
                    }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </div>

            {/* Quick Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TradeTypeBadge type={trade.type} />
                            <span className="text-xs text-gray-300 font-medium">
                                {format(formattedDate, "MMM d")}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                            {trade.symbol}
                        </h3>
                    </div>

                    <div className="text-right">
                        <PnLDisplay
                            value={trade.pnl}
                            showIcon={true}
                            className="text-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Hover Action */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white">
                    <Maximize2 size={24} />
                </div>
            </div>
        </div>
    );
}
