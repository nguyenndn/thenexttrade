"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Cable,
    Rocket,
    FileText,
    Trophy,
    GraduationCap,
    TrendingUp,
    Target,
    ArrowRight,
    X,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/track";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";

interface MilestoneData {
    id: string;
    title: string;
    message: string;
    icon: string;
    link: string;
}

const ICON_MAP: Record<
    string,
    { Icon: LucideIcon; gradient: string; shadow: string }
> = {
    Cable: {
        Icon: Cable,
        gradient: "from-primary to-teal-400",
        shadow: "shadow-primary/30",
    },
    Rocket: {
        Icon: Rocket,
        gradient: "from-primary to-teal-400",
        shadow: "shadow-primary/30",
    },
    FileText: {
        Icon: FileText,
        gradient: "from-blue-500 to-cyan-400",
        shadow: "shadow-blue-500/30",
    },
    Trophy: {
        Icon: Trophy,
        gradient: "from-amber-400 to-amber-600",
        shadow: "shadow-amber-500/30",
    },
    GraduationCap: {
        Icon: GraduationCap,
        gradient: "from-purple-500 to-violet-400",
        shadow: "shadow-purple-500/30",
    },
    TrendingUp: {
        Icon: TrendingUp,
        gradient: "from-emerald-500 to-green-400",
        shadow: "shadow-emerald-500/30",
    },
    Target: {
        Icon: Target,
        gradient: "from-orange-500 to-amber-400",
        shadow: "shadow-orange-500/30",
    },
};

export function MilestoneCelebrationModal() {
    const [queue, setQueue] = useState<MilestoneData[]>([]);
    const [current, setCurrent] = useState<MilestoneData | null>(null);
    const fetched = useRef(false);

    // Fetch uncelebrated milestones on mount
    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        const timer = setTimeout(() => {
            fetch("/api/milestones/celebrate")
                .then((res) => (res.ok ? res.json() : []))
                .then((data: MilestoneData[]) => {
                    if (Array.isArray(data) && data.length > 0) {
                        setQueue(data);
                    }
                })
                .catch(() => {});
        }, 2000); // Delay to let dashboard load first

        return () => clearTimeout(timer);
    }, []);

    // Show next milestone from queue
    useEffect(() => {
        if (!current && queue.length > 0) {
            const [next, ...rest] = queue;
            setCurrent(next);
            setQueue(rest);
            // Fire confetti
            setTimeout(() => fireConfetti(), 200);
        }
    }, [current, queue]);

    // Body scroll lock while a milestone card is on screen.
    useEffect(() => {
        if (current) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [current]);

    const fireConfetti = useCallback(async () => {
        const confetti = (await import("canvas-confetti")).default;
        const duration = 2000;
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

            const particleCount = 35 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: {
                    x: randomInRange(0.2, 0.4),
                    y: randomInRange(0.2, 0.4),
                },
                colors: ["#FFD700", "#00C888", "#06B6D4", "#8B5CF6"],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: {
                    x: randomInRange(0.6, 0.8),
                    y: randomInRange(0.2, 0.4),
                },
                colors: ["#FFD700", "#FFA500", "#00C888", "#3B82F6"],
            });
        }, 200);
    }, []);

    const handleCelebrate = async (navigateToLink: boolean) => {
        if (!current) return;

        trackEvent("milestone_celebrated", {
            milestoneId: current.id,
            navigated: navigateToLink ? "yes" : "no",
        });

        // Mark as celebrated
        fetch("/api/milestones/celebrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ milestoneIds: [current.id] }),
        }).catch(() => {});

        // Navigate or show next after the exit animation window
        setTimeout(() => {
            if (navigateToLink && current.link) {
                window.location.href = current.link;
            }
            setCurrent(null); // triggers next from queue
        }, 300);
    };

    return (
        <AnimatePresence>
            {current &&
                (() => {
                    const iconConfig =
                        ICON_MAP[current.icon] || ICON_MAP.Trophy;
                    const { Icon, gradient, shadow } = iconConfig;
                    return (
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
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => handleCelebrate(false)}
                            />

                            {/* Modal */}
                            <motion.div
                                variants={panelVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={SPRING_SOFT}
                                className="relative z-10 bg-white dark:bg-[#1E2028] rounded-2xl w-full max-w-md overflow-hidden border border-dashboard shadow-2xl"
                            >
                {/* Close */}
                <Button
                    onClick={() => handleCelebrate(false)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-20 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10"
                    aria-label="Close"
                >
                    <X size={18} />
                </Button>

                {/* Header with glow */}
                <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/5 pointer-events-none" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10">
                        {/* Milestone icon */}
                        <div
                            className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} mb-4 animate-bounce`}
                        >
                            <Icon size={28} className="text-white" />
                        </div>

                        {/* Queue indicator */}
                        {queue.length > 0 && (
                            <div className="absolute top-2 left-6 flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500">
                                <Trophy size={12} className="text-primary" />+
                                {queue.length} more
                            </div>
                        )}

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            {current.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                            {current.message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2">
                    <Button
                        variant="primary"
                        onClick={() => handleCelebrate(true)}
                        className="w-full h-12 font-bold shadow-lg shadow-primary/20 gap-2"
                    >
                        Check it out
                        <ArrowRight size={16} />
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => handleCelebrate(false)}
                        className="w-full h-10 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Got it!
                    </Button>
                            </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
        </AnimatePresence>
    );
}
