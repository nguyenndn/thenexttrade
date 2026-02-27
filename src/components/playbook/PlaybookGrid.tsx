"use client";

import { PlaybookCard } from "./PlaybookCard";
import { ImageOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface PlaybookGridProps {
    trades: any[];
    isLoading: boolean;
    onTradeClick: (trade: any) => void;
}

export function PlaybookGrid({ trades, isLoading, onTradeClick }: PlaybookGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[16/9] bg-gray-100 dark:bg-[#1E2028] rounded-xl animate-pulse border border-gray-100 dark:border-white/5" />
                ))}
            </div>
        );
    }

    if (trades.length === 0) {
        return (
            <EmptyState 
                icon={ImageOff}
                title="No Screenshots Found"
                description="Trades with screenshots will appear here automatically. Add images to your journal entries to build your playbook."
                className="bg-gray-50/50 dark:bg-black/20 min-h-[400px] border border-dashed border-gray-200 dark:border-white/10 rounded-xl"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trades.map((trade) => (
                <PlaybookCard
                    key={trade.id}
                    trade={trade}
                    onClick={() => onTradeClick(trade)}
                />
            ))}
        </div>
    );
}
