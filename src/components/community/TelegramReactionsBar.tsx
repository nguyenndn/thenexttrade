"use client";

import { Award, Flame, Heart, Rocket, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ReactionCounts {
    flame: number;
    rocket: number;
    heart: number;
    hundred: number;
    handshake: number;
}

export type ReactionKey = keyof ReactionCounts;

interface TelegramReactionsBarProps {
    reactions: ReactionCounts;
    userReacted: Record<string, boolean>;
    onReact: (key: ReactionKey) => void;
}

const REACTION_ITEMS = [
    { key: "flame", label: "Flame", Icon: Flame, color: "text-amber-500" },
    { key: "rocket", label: "Rocket", Icon: Rocket, color: "text-gold" },
    { key: "heart", label: "Heart", Icon: Heart, color: "text-rose-500" },
    { key: "hundred", label: "100", Icon: Award, color: "text-emerald-500" },
    {
        key: "handshake",
        label: "Agree",
        Icon: ThumbsUp,
        color: "text-amber-500 dark:text-gold",
    },
] as const;

export function TelegramReactionsBar({
    reactions,
    userReacted,
    onReact,
}: TelegramReactionsBarProps) {
    return (
        <div className="px-4 py-3 bg-white dark:bg-[#17212B] border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold text-[11px]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE REACTIONS</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {REACTION_ITEMS.map((item) => {
                    const isSelected = Boolean(userReacted[item.key]);
                    const ReactionIcon = item.Icon;
                    return (
                        <Button
                            key={item.key}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onReact(item.key)}
                            aria-label={`React with ${item.label}`}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all transform active:scale-95 h-auto ${
                                isSelected
                                    ? "bg-gold/15 border border-gold text-amber-700 dark:text-gold shadow-xs hover:bg-gold/20 hover:text-amber-700 dark:hover:text-gold"
                                    : "bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10"
                            }`}
                        >
                            <ReactionIcon size={12} className={item.color} />
                            <span className="tabular-nums">
                                {reactions[item.key]}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
