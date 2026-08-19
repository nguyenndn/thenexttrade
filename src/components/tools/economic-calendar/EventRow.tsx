"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EconomicEvent, ImpactLevel } from "@prisma/client";
import { format } from "date-fns";
import { Info, X, ShieldAlert, Lightbulb, Clock, Globe } from "lucide-react";
import { getEventExplanation } from "@/lib/economic-event-explanations";
import { Button } from "@/components/ui/Button";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";

interface EventRowProps {
    event: EconomicEvent;
    timezone?: string;
}

export function EventRow({ event, timezone = "Asia/Bangkok" }: EventRowProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Body scroll lock while the detail modal is open.
    useEffect(() => {
        if (isDetailOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isDetailOpen]);

    const impactColors = {
        [ImpactLevel.HIGH]: "bg-red-500 text-white",
        [ImpactLevel.MEDIUM]: "bg-amber-500 text-white",
        [ImpactLevel.LOW]: "bg-emerald-500 text-white",
    };

    const roundedImpact = {
        [ImpactLevel.HIGH]: "High",
        [ImpactLevel.MEDIUM]: "Medium",
        [ImpactLevel.LOW]: "Low",
    };

    // Format time based on timezone
    const formatTime = (dateStr: Date | string) => {
        try {
            return new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: timezone,
                hour12: false,
            }).format(new Date(dateStr));
        } catch (e) {
            return format(new Date(dateStr), "HH:mm");
        }
    };

    const explanation = getEventExplanation(event.title);

    return (
        <>
            <div
                onClick={() => setIsDetailOpen(true)}
                className="grid grid-cols-12 gap-1 md:gap-2 py-3 border-b border-dashboard hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center px-4 group cursor-pointer"
            >
                <div className="col-span-2 md:col-span-1 text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <span>{formatTime(event.date)}</span>
                </div>

                <div className="col-span-2 md:col-span-1 flex justify-center">
                    <span className="font-bold text-gray-700 dark:text-white px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-xs w-12 text-center">
                        {event.currency}
                    </span>
                </div>

                <div className="col-span-2 md:col-span-1 flex justify-center">
                    <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wide w-16 text-center ${impactColors[event.impact]}`}
                    >
                        {roundedImpact[event.impact]}
                    </span>
                </div>

                <div className="col-span-6 md:col-span-5 flex items-center justify-between gap-2">
                    <p
                        className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1 group-hover:text-gold transition-colors"
                        title={event.title}
                    >
                        {event.title}
                    </p>
                    <Info size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div className="hidden md:block col-span-4">
                    <div className="grid grid-cols-3 gap-2 text-sm font-mono font-semibold">
                        <div className="text-center text-gray-700 dark:text-gray-300">
                            {event.forecast || "--"}
                        </div>
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            {event.previous || "--"}
                        </div>
                        <div className="text-center text-gray-700 dark:text-gray-300">
                            {event.actual || "--"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Educational Detail Modal */}
            <AnimatePresence>
                {isDetailOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsDetailOpen(false)}
                >
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="bg-white dark:bg-[#151925] border border-gold/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsDetailOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${impactColors[event.impact]}`}>
                                {event.currency} • {event.impact}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock size={13} />
                                <span>{formatTime(event.date)} ({timezone})</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-4">
                            {event.title}
                        </h3>

                        {/* Figures */}
                        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] border border-dashboard rounded-xl mb-5 text-center font-mono">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans font-bold">Forecast</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{event.forecast || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans font-bold">Previous</span>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{event.previous || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans font-bold">Actual</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{event.actual || "N/A"}</span>
                            </div>
                        </div>

                        {/* Educational Insights */}
                        {explanation ? (
                            <div className="space-y-3 bg-gold/5 border border-gold/15 rounded-xl p-4 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-gold uppercase tracking-wider text-[11px]">
                                    <Lightbulb size={14} />
                                    <span>{explanation.category} Overview</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {explanation.impactDescription}
                                </p>
                                <div className="pt-2 border-t border-gold/15">
                                    <span className="font-bold text-gray-900 dark:text-white block mb-1">Trading Takeaway:</span>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {explanation.tradingTakeaway}
                                    </p>
                                </div>
                                <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-400 text-[10px] uppercase">Primary Affected Assets:</span>
                                    {explanation.affectedAssets.map((asset) => (
                                        <span key={asset} className="px-2 py-0.5 bg-white dark:bg-[#1E2028] border border-gold/20 rounded-lg font-mono font-bold text-[11px] text-gray-800 dark:text-gray-200">
                                            {asset}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-dashboard rounded-xl text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                High-impact macroeconomic releases often cause sharp price volatility and slippage. Exercise caution when trading near release time.
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="mt-5 flex items-center justify-between gap-4 pt-3 border-t border-dashboard text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <ShieldAlert size={12} className="text-amber-500" />
                                Educational Market Context
                            </span>
                            <Button variant="outline" size="smd" onClick={() => setIsDetailOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
