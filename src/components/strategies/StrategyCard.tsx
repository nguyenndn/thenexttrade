"use client";

import { useState } from "react";
import { Edit2, Trash2, Target, TrendingUp, Percent, Save, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Strategy, StrategyPerformance } from "./StrategyManager";
import { PlaybookLightbox } from "./PlaybookLightbox";

export function StrategyCard({
    strategy,
    performance,
    isGhost,
    onEdit,
    onDelete,
}: {
    strategy: Strategy;
    performance?: StrategyPerformance;
    isGhost?: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    return (
        <>
            <div
                className={`bg-white dark:bg-[#1E2028] p-6 rounded-xl border shadow-sm group hover:border-primary/50 hover:shadow-md transition-shadow flex flex-col justify-between ${
                    isGhost
                        ? "border-dashed border-gray-300 dark:border-white/20"
                        : "border-dashboard"
                }`}
            >
                <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: strategy.color }}
                            />
                            <h3 className="font-bold text-lg text-gray-700 dark:text-white flex items-center gap-2 flex-wrap">
                                {strategy.name}
                                {strategy.isPlaybook && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                        <BookOpen size={10} />
                                        Playbook
                                    </span>
                                )}
                                {isGhost && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                                        Unsaved
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onEdit}
                                className="text-gray-500 hover:text-gray-600 dark:hover:text-white border-transparent hover:border-dashboard dark:hover:border-white/10"
                                aria-label="Edit strategy"
                            >
                                <Edit2 size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onDelete}
                                className="hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                                aria-label="Delete strategy"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="min-h-[36px] mb-3">
                        {strategy.description ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {strategy.description}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 italic">
                                No description
                            </p>
                        )}
                    </div>

                    {/* Playbook Metadata */}
                    {strategy.isPlaybook && (
                        <div className="mb-4 space-y-2.5 p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.03] border border-dashboard">
                            {/* Setup type + R:R */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                {strategy.setupType ? (
                                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <Layers size={12} className="text-primary" />
                                        {strategy.setupType}
                                    </span>
                                ) : (
                                    <span className="italic text-gray-400">Setup Pattern</span>
                                )}
                                {strategy.riskRewardMin != null && (
                                    <span>
                                        Min R:R <strong className="text-primary">{strategy.riskRewardMin}:1</strong>
                                    </span>
                                )}
                            </div>

                            {/* Timeframes + Pairs chips */}
                            {(strategy.timeframes.length > 0 || strategy.pairs.length > 0) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {strategy.timeframes.map((tf) => (
                                        <span
                                            key={tf}
                                            className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md"
                                        >
                                            {tf}
                                        </span>
                                    ))}
                                    {strategy.pairs.map((pair) => (
                                        <span
                                            key={pair}
                                            className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-md"
                                        >
                                            {pair}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Ideal zones snippet */}
                            {(strategy.idealEntry || strategy.idealStopLoss || strategy.idealTakeProfit) && (
                                <div className="text-[11px] text-gray-500 space-y-0.5 pt-1 border-t border-dashboard/50">
                                    {strategy.idealEntry && (
                                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Entry:</span> {strategy.idealEntry}</div>
                                    )}
                                    {strategy.idealStopLoss && (
                                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">SL:</span> {strategy.idealStopLoss}</div>
                                    )}
                                </div>
                            )}

                            {/* Reference image thumbnails */}
                            {strategy.referenceImages.length > 0 && (
                                <div className="pt-1">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                        Reference Charts ({strategy.referenceImages.length})
                                    </p>
                                    <div className="flex gap-2">
                                        {strategy.referenceImages.map((url, idx) => (
                                            <button
                                                type="button"
                                                key={url}
                                                onClick={() => setLightboxIndex(idx)}
                                                className="w-16 h-10 rounded-lg overflow-hidden border border-dashboard hover:border-primary/50 transition-colors relative group/img cursor-pointer"
                                                aria-label={`Preview reference chart ${idx + 1}`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Reference ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rules */}
                    {strategy.rules && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                Rules & Confirmations
                            </p>
                            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-dashboard whitespace-pre-line max-h-[100px] overflow-y-auto custom-scrollbar font-mono text-xs">
                                {strategy.rules}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    {/* Stats */}
                    {performance ? (
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <Target
                                    size={16}
                                    className="mx-auto mb-1 text-purple-500"
                                />
                                <p className="text-base font-bold text-gray-700 dark:text-white">
                                    {(performance.winRate ?? 0).toFixed(0)}%
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">
                                    Win Rate
                                </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <TrendingUp
                                    size={16}
                                    className={`mx-auto mb-1 ${performance.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                                />
                                <p
                                    className={`text-base font-bold ${performance.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                    ${Math.abs(performance.totalPnL ?? 0).toFixed(0)}
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">
                                    P&L
                                </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <Percent
                                    size={16}
                                    className="mx-auto mb-1 text-blue-500"
                                />
                                <p className="text-base font-bold text-gray-700 dark:text-white">
                                    {performance.profitFactor === Infinity || performance.profitFactor >= 99
                                        ? "MAX"
                                        : (performance.profitFactor ?? 0).toFixed(1)}
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">
                                    PF
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-dashboard">
                            <p className="text-xs text-gray-500">No trades recorded</p>
                        </div>
                    )}

                    {/* Save Ghost Button */}
                    {isGhost && (
                        <div className="mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
                            <Button
                                variant="outline"
                                onClick={onEdit}
                                className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-bold border border-primary/20 transition-colors"
                            >
                                <Save size={16} />
                                <span>Save to Library</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox for full chart preview */}
            {lightboxIndex !== null && (
                <PlaybookLightbox
                    isOpen={lightboxIndex !== null}
                    images={strategy.referenceImages}
                    initialIndex={lightboxIndex}
                    title={`${strategy.name} — Reference Chart`}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
