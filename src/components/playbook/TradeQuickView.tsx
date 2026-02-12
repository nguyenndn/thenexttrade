"use client";

import { X, ChevronLeft, ChevronRight, Calendar, Target, Activity, DollarSign, Brain, MoveRight } from "lucide-react";
// import Image from "next/image"; // Removed to allow external URLs
import { format } from "date-fns";
import { useState } from "react";

interface TradeQuickViewProps {
    trade: any;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export function TradeQuickView({ trade, onClose, onNext, onPrev }: TradeQuickViewProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!trade) return null;

    const images = trade.images || [];
    const isWin = (trade.pnl || 0) > 0;
    const isLoss = (trade.pnl || 0) < 0;

    const nextImage = () => {
        if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#151925] w-full max-w-6xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col lg:flex-row shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left: Image Gallery */}
                <div className="lg:w-2/3 bg-black/90 relative flex items-center justify-center h-[40vh] lg:h-auto overflow-hidden group">
                    {images.length > 0 ? (
                        <>
                            <div className="relative w-full h-full">
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${trade.symbol} Screenshot`}
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/800x600?text=Image+Load+Error";
                                    }}
                                />
                            </div>

                            {/* Image Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        disabled={currentImageIndex === 0}
                                        className="absolute left-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-0 transition-opacity"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        disabled={currentImageIndex === images.length - 1}
                                        className="absolute right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-0 transition-opacity"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                    {/* Dots */}
                                    <div className="absolute bottom-4 flex gap-2">
                                        {images.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/30'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-500">No Image Available</div>
                    )}
                </div>

                {/* Right: Trade Details */}
                <div className="lg:w-1/3 flex flex-col bg-white dark:bg-[#1E2028] border-l border-gray-100 dark:border-white/5">

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{trade.symbol}</h2>
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mt-1">
                                    <Calendar size={14} />
                                    {format(new Date(trade.entryDate), "MMM d, yyyy • HH:mm")}
                                </div>
                            </div>
                            <div className={`text-2xl font-mono font-bold ${isWin ? 'text-primary' : isLoss ? 'text-red-500' : 'text-gray-400'}`}>
                                {isWin ? '+' : ''}${Math.abs(trade.pnl || 0).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${trade.type === 'BUY'
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                }`}>
                                {trade.type}
                            </span>
                            {trade.strategy && (
                                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                    {trade.strategy}
                                </span>
                            )}
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">
                                {trade.lotSize} Lots
                            </span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Price Action */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Entry</label>
                                <div className="font-mono text-lg font-bold text-gray-900 dark:text-white">{trade.entryPrice}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Exit</label>
                                <div className="font-mono text-lg font-bold text-gray-900 dark:text-white">{trade.exitPrice || "---"}</div>
                            </div>
                        </div>

                        {/* Notes */}
                        {trade.notes && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Activity size={16} className="text-primary" />
                                    Analysis Notes
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                    {trade.notes}
                                </p>
                            </div>
                        )}

                        {/* Psychology (If available) */}
                        {trade.emotionBefore && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Brain size={16} className="text-purple-500" />
                                    Psychology
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Before</div>
                                        <div className="capitalize font-medium text-gray-700 dark:text-gray-200">{trade.emotionBefore}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">After</div>
                                        <div className="capitalize font-medium text-gray-700 dark:text-gray-200">{trade.emotionAfter || "-"}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Entry/Exit Reason */}
                        {(trade.entryReason || trade.exitReason) && (
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                {trade.entryReason && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Entry Reason</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{trade.entryReason}</p>
                                    </div>
                                )}
                                {trade.exitReason && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Exit Reason</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{trade.exitReason}</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Footer Nav */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={16} /> Previous Trade
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            Next Trade <ChevronRight size={16} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
