"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";

interface LevelUpEventData {
    xp: number;
    message?: string;
    badge?: string | null;
    leveledUp?: boolean;
}

export function LevelUpModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<LevelUpEventData | null>(null);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
    }, [isOpen]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    const fireContinuousConfetti = useCallback(async () => {
        const confetti = (await import("canvas-confetti")).default;
        const duration = 2500;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 25,
            spread: 360,
            ticks: 50,
            zIndex: 10000,
        };

        const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 40 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: {
                    x: randomInRange(0.2, 0.4),
                    y: randomInRange(0.2, 0.4),
                },
                colors: ["#FFD700", "#FFA500", "#FF8C00", "#00C888"],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: {
                    x: randomInRange(0.6, 0.8),
                    y: randomInRange(0.2, 0.4),
                },
                colors: ["#FFD700", "#FFA500", "#FF8C00", "#06B6D4"],
            });
        }, 200);
    }, []);

    useEffect(() => {
        const handleLevelUp = (e: Event) => {
            const customEvent = e as CustomEvent<LevelUpEventData>;
            if (customEvent.detail) {
                setData(customEvent.detail);
                setIsOpen(true);
                // Fire confetti celebration
                setTimeout(fireContinuousConfetti, 100);
            }
        };

        window.addEventListener("tnt_level_up", handleLevelUp);
        return () => {
            window.removeEventListener("tnt_level_up", handleLevelUp);
        };
    }, [fireContinuousConfetti]);

    return (
        <AnimatePresence onExitComplete={releaseLock}>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-[#07090E]/90 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Card */}
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative z-10 w-full max-w-md bg-[#0D111A] border border-amber-500/30 rounded-lg shadow-2xl shadow-amber-500/10 overflow-hidden p-8 text-center"
                    >
                {/* Glowing Auroras */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Close Button */}
                <Button
                    variant="ghost"
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg w-auto h-auto hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                >
                    <X size={16} />
                </Button>

                {/* Level Up Badge Crown */}
                <div className="relative inline-flex items-center justify-center p-5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-6">
                    <Trophy size={36} className="relative z-10" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                    Level Up
                </h2>
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-6">
                    {data?.message || "New Level Unlocked"}
                </p>

                {/* Level Display */}
                <div className="py-5 px-6 rounded-lg bg-white/[0.02] border border-white/5 mb-8 relative group overflow-hidden">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                        Edge Level
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                            PRO TRADER
                        </span>
                    </div>
                    <div className="flex justify-center items-center gap-1.5 mt-3 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 w-fit mx-auto">
                        <Zap size={12} className="fill-amber-500" />
                        <span>+{data?.xp} Edge Points Awarded</span>
                    </div>
                </div>

                {/* Badge reward alert if any */}
                {data?.badge && (
                    <div className="mb-6 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                        <Trophy size={14} />
                        <span>
                            New Badge Unlocked: &quot;{data.badge}&quot;
                        </span>
                    </div>
                )}

                {/* Keep Going CTA */}
                <Button
                    size="smd"
                    variant="gold"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-xs font-black uppercase tracking-wider"
                >
                    Continue Trading
                </Button>
                </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
