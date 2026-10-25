"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    Trophy,
    Star,
    BookOpen,
    Layers,
    BarChart3,
    TrendingUp,
    Target,
    Globe,
    Compass,
    Map,
    Shield,
    Brain,
    Rocket,
    X,
    Sparkles,
} from "lucide-react";

interface LevelUpCelebrationProps {
    isActive: boolean;
    levelOrder: number;
    levelTitle: string;
    autoDismiss?: boolean; // true = auto-dismiss (first unlock), false = stay until user closes (replay)
    onComplete: () => void;
}

/* ── Per-Level Theme Config ─────────────────────── */
interface LevelTheme {
    icon: typeof Trophy;
    gradient: string; // badge gradient
    glowColor: string; // rgba glow
    accentCSS: string; // tailwind text color for subtitle
    ringColor: string; // shockwave ring border
    confettiPalette: string[];
    heading: string;
    message: string;
    quote: string;
    cta: string;
}

const LEVEL_THEMES: Record<number, LevelTheme> = {
    1: {
        icon: BookOpen,
        gradient: "from-blue-400 via-cyan-400 to-blue-500",
        glowColor: "rgba(59,130,246,0.5)",
        accentCSS: "text-blue-600 dark:text-blue-400",
        ringColor: "border-blue-400",
        confettiPalette: [
            "#3b82f6",
            "#06b6d4",
            "#60a5fa",
            "#22d3ee",
            "#38bdf8",
            "#67e8f9",
        ],
        heading: "First Steps Complete",
        message:
            "Welcome to real-market Forex trading. Focus on cold execution rules and risk control from day one.",
        quote: "Every disciplined trader starts with the basics. Fundamentals first, capital preservation always.",
        cta: "Continue to Foundations",
    },
    2: {
        icon: Layers,
        gradient: "from-amber-400 via-yellow-500 to-orange-500",
        glowColor: "rgba(245,158,11,0.5)",
        accentCSS: "text-amber-600 dark:text-amber-400",
        ringColor: "border-amber-400",
        confettiPalette: [
            "#f59e0b",
            "#eab308",
            "#fbbf24",
            "#facc15",
            "#fcd34d",
            "#fde047",
        ],
        heading: "Foundations Built",
        message:
            "Your trading foundation is in place. You now understand broker custody, order types, and basic chart structure.",
        quote: "A clear understanding of market mechanics protects your capital from beginner mistakes.",
        cta: "Proceed to Technical Structure",
    },
    3: {
        icon: BarChart3,
        gradient: "from-teal-400 via-emerald-400 to-teal-500",
        glowColor: "rgba(20,184,166,0.5)",
        accentCSS: "text-teal-600 dark:text-teal-400",
        ringColor: "border-teal-400",
        confettiPalette: [
            "#14b8a6",
            "#10b981",
            "#2dd4bf",
            "#34d399",
            "#5eead4",
            "#6ee7b7",
        ],
        heading: "Market Structure",
        message:
            "Support, resistance, liquidity pools, and price delivery are now part of your daily technical lens.",
        quote: "The charts reflect human psychology and order flow. You have learned to read both.",
        cta: "Advance to Price Action Patterns",
    },
    4: {
        icon: TrendingUp,
        gradient: "from-emerald-400 via-green-400 to-emerald-500",
        glowColor: "rgba(16,185,129,0.5)",
        accentCSS: "text-emerald-600 dark:text-emerald-400",
        ringColor: "border-emerald-400",
        confettiPalette: [
            "#10b981",
            "#22c55e",
            "#34d399",
            "#4ade80",
            "#6ee7b7",
            "#86efac",
        ],
        heading: "Pattern Recognition",
        message:
            "You can now identify high-probability chart patterns and market structure with precision.",
        quote: "Patterns are not predictions — they are probabilistic setups with defined risk.",
        cta: "Build Your Execution Strategy",
    },
    5: {
        icon: Target,
        gradient: "from-green-400 via-lime-400 to-green-500",
        glowColor: "rgba(34,197,94,0.5)",
        accentCSS: "text-green-600 dark:text-green-400",
        ringColor: "border-green-400",
        confettiPalette: [
            "#22c55e",
            "#84cc16",
            "#4ade80",
            "#a3e635",
            "#86efac",
            "#bef264",
        ],
        heading: "Strategy Architect",
        message:
            "You now think in probabilistic systems. A systematic plan separates long-term winners from gamblers.",
        quote: "A trading system is a defined set of rules that eliminates emotional decision-making.",
        cta: "Explore Macro Fundamentals",
    },
    6: {
        icon: Globe,
        gradient: "from-amber-400 via-yellow-400 to-amber-500",
        glowColor: "rgba(245,158,11,0.5)",
        accentCSS: "text-amber-600 dark:text-amber-400",
        ringColor: "border-amber-400",
        confettiPalette: [
            "#f59e0b",
            "#eab308",
            "#fbbf24",
            "#facc15",
            "#fcd34d",
            "#fde047",
        ],
        heading: "Macro Fundamentals",
        message:
            "Central bank rates, economic releases, and geopolitical context form the backdrop of your trades.",
        quote: "Understanding the fundamental driver gives you the conviction to hold through volatility.",
        cta: "Study Intermarket Analysis",
    },
    7: {
        icon: Compass,
        gradient: "from-orange-400 via-amber-400 to-orange-500",
        glowColor: "rgba(249,115,22,0.5)",
        accentCSS: "text-orange-600 dark:text-orange-400",
        ringColor: "border-orange-400",
        confettiPalette: [
            "#f97316",
            "#f59e0b",
            "#fb923c",
            "#fbbf24",
            "#fdba74",
            "#fcd34d",
        ],
        heading: "Intermarket Analysis",
        message:
            "Cross-asset correlations and currency strength dynamics give you edge across sessions.",
        quote: "Capital flows between asset classes. Spotting the trend early is your edge.",
        cta: "Refine Your Complete System",
    },
    8: {
        icon: Map,
        gradient: "from-rose-400 via-pink-400 to-rose-500",
        glowColor: "rgba(244,63,94,0.5)",
        accentCSS: "text-rose-600 dark:text-rose-400",
        ringColor: "border-rose-400",
        confettiPalette: [
            "#f43f5e",
            "#ec4899",
            "#fb7185",
            "#f472b6",
            "#fda4af",
            "#f9a8d4",
        ],
        heading: "System Builder",
        message:
            "You have built a complete trading system — from entry to exit, from rules to execution.",
        quote: "Flawless execution of a tested strategy is the hallmark of professional consistency.",
        cta: "Master Capital Preservation",
    },
    9: {
        icon: Shield,
        gradient: "from-red-400 via-orange-400 to-red-500",
        glowColor: "rgba(239,68,68,0.5)",
        accentCSS: "text-red-600 dark:text-red-400",
        ringColor: "border-red-400",
        confettiPalette: [
            "#ef4444",
            "#f97316",
            "#f87171",
            "#fb923c",
            "#fca5a5",
            "#fdba74",
        ],
        heading: "Risk & Capital Preservation",
        message:
            "Capital preservation is the ultimate skill. Hard stop-losses and strict sizing protect your survival.",
        quote: "It's not about how much you make — it's about how well you protect what you have.",
        cta: "Train Trading Psychology",
    },
    10: {
        icon: Brain,
        gradient: "from-indigo-400 via-violet-400 to-indigo-500",
        glowColor: "rgba(129,140,248,0.5)",
        accentCSS: "text-indigo-600 dark:text-indigo-400",
        ringColor: "border-indigo-400",
        confettiPalette: [
            "#818cf8",
            "#a78bfa",
            "#6366f1",
            "#8b5cf6",
            "#a5b4fc",
            "#c4b5fd",
        ],
        heading: "Execution Psychology",
        message:
            "Revenge trading, FOMO, and hesitation eliminated. You execute with neutral, cold discipline.",
        quote: "Trading is 10% analysis and 90% emotional control under financial pressure.",
        cta: "Proceed to Final Evaluation",
    },
    11: {
        icon: Rocket,
        gradient: "from-pink-400 via-rose-400 to-pink-500",
        glowColor: "rgba(236,72,153,0.5)",
        accentCSS: "text-pink-600 dark:text-pink-400",
        ringColor: "border-pink-400",
        confettiPalette: [
            "#ec4899",
            "#f43f5e",
            "#f472b6",
            "#fb7185",
            "#f9a8d4",
            "#fda4af",
        ],
        heading: "Full Academy Curriculum Completed",
        message:
            "You have completed the entire TheNextTrade Academy curriculum. You are equipped with cold risk math and systematic discipline.",
        quote: "Education provides the foundation. Strict daily risk management delivers the result.",
        cta: "Review Your Trader Profile",
    },
};

const DEFAULT_THEME: LevelTheme = {
    icon: Trophy,
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    glowColor: "rgba(245,158,11,0.5)",
    accentCSS: "text-amber-600 dark:text-amber-400",
    ringColor: "border-primary",
    confettiPalette: [
        "#10b981",
        "#06b6d4",
        "#3b82f6",
        "#f59e0b",
        "#ef4444",
        "#ec4899",
    ],
    heading: "Level Complete",
    message:
        "Great work. You are building consistent market knowledge and systematic discipline.",
    quote: "Consistent execution over 100 trades beats any single lucky winner.",
    cta: "Continue to Next Module",
};

/* ── Particle Generators ─────────────────────── */
function generateConfetti(count: number, palette: string[]) {
    const shapes = ["square", "circle", "triangle"] as const;
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 200,
        velocityY: -(Math.random() * 600 + 200),
        delay: Math.random() * 0.3,
        duration: Math.random() * 1.5 + 1.5,
    }));
}

function generateStars(count: number) {
    return Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 80 + Math.random() * 150;
        return {
            id: i,
            endX: Math.cos(angle) * distance,
            endY: Math.sin(angle) * distance,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 0.2,
        };
    });
}

function ConfettiPiece({
    piece,
}: {
    piece: ReturnType<typeof generateConfetti>[0];
}) {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{
                left: `${piece.x}%`,
                bottom: "50%",
                width: piece.size,
                height:
                    piece.shape === "circle" ? piece.size : piece.size * 1.5,
                backgroundColor:
                    piece.shape !== "triangle" ? piece.color : "transparent",
                borderRadius:
                    piece.shape === "circle"
                        ? "50%"
                        : piece.shape === "square"
                          ? "2px"
                          : "0",
                borderLeft:
                    piece.shape === "triangle"
                        ? `${piece.size / 2}px solid transparent`
                        : undefined,
                borderRight:
                    piece.shape === "triangle"
                        ? `${piece.size / 2}px solid transparent`
                        : undefined,
                borderBottom:
                    piece.shape === "triangle"
                        ? `${piece.size}px solid ${piece.color}`
                        : undefined,
            }}
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{
                y: [0, piece.velocityY, piece.velocityY + 800],
                x: [0, piece.velocityX * 0.5, piece.velocityX],
                opacity: [0, 1, 1, 0],
                rotate: [0, piece.angle, piece.angle * 3],
            }}
            transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
        />
    );
}

/* ── Main Component ─────────────────────── */
export function LevelUpCelebration({
    isActive,
    levelOrder,
    levelTitle,
    autoDismiss = true,
    onComplete,
}: LevelUpCelebrationProps) {
    const [phase, setPhase] = useState<"idle" | "burst" | "reveal" | "fadeout">(
        "idle"
    );
    const theme = LEVEL_THEMES[levelOrder] || DEFAULT_THEME;
    const LevelIcon = theme.icon;

    const confetti = useMemo(
        () => generateConfetti(80, theme.confettiPalette),
        [theme.confettiPalette]
    );
    const stars = useMemo(() => generateStars(24), []);

    const handleDismiss = useCallback(() => {
        setPhase("fadeout");
        setTimeout(() => {
            setPhase("idle");
            onComplete();
        }, 800);
    }, [onComplete]);

    useEffect(() => {
        if (!isActive) {
            setPhase("idle");
            return;
        }
        setPhase("burst");
        const t1 = setTimeout(() => setPhase("reveal"), 400);

        if (autoDismiss) {
            const t2 = setTimeout(() => setPhase("fadeout"), 3800);
            const t3 = setTimeout(() => {
                setPhase("idle");
                onComplete();
            }, 4600);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }

        return () => {
            clearTimeout(t1);
        };
    }, [isActive, onComplete, autoDismiss]);

    if (phase === "idle") return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={
                    !autoDismiss && phase === "reveal"
                        ? handleDismiss
                        : undefined
                }
            >
                {/* Dimmed overlay — tree stays visible behind */}
                <motion.div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === "fadeout" ? 0 : 1 }}
                    transition={{ duration: phase === "fadeout" ? 0.8 : 0.3 }}
                />

                {/* === SHOCKWAVE RINGS (themed color) === */}
                {(phase === "burst" || phase === "reveal") && (
                    <>
                        {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                                key={`ring-${i}`}
                                className={`absolute w-32 h-32 rounded-full border-2 ${theme.ringColor}`}
                                initial={{ scale: 0, opacity: 0.8 }}
                                animate={{
                                    scale: [0, 8 + i * 3],
                                    opacity: [0.8, 0],
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                    </>
                )}

                {/* === RADIAL LIGHT BURST (themed glow) === */}
                {(phase === "burst" || phase === "reveal") && (
                    <motion.div
                        className="absolute w-64 h-64 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${theme.glowColor} 0%, ${theme.glowColor.replace("0.5", "0.2")} 40%, transparent 70%)`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 4, 3], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                )}

                {/* === STAR BURST PARTICLES === */}
                {(phase === "burst" || phase === "reveal") &&
                    stars.map((star) => (
                        <motion.div
                            key={`star-${star.id}`}
                            className="absolute w-1 h-1 rounded-full"
                            style={{
                                backgroundColor: theme.confettiPalette[0],
                                boxShadow: `0 0 6px 2px ${theme.glowColor}`,
                            }}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            animate={{
                                x: [0, star.endX],
                                y: [0, star.endY],
                                scale: [0, star.size, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 0.8,
                                delay: star.delay + 0.1,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                {/* === CONFETTI (themed palette) === */}
                {(phase === "burst" || phase === "reveal") &&
                    confetti.map((piece) => (
                        <ConfettiPiece
                            key={`confetti-${piece.id}`}
                            piece={piece}
                        />
                    ))}

                {/* === SPARKLE RING === */}
                {phase === "reveal" && (
                    <motion.div
                        className="absolute"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const r = 140;
                            return (
                                <motion.div
                                    key={`sparkle-${i}`}
                                    className="absolute"
                                    style={{
                                        left: Math.cos(angle) * r,
                                        top: Math.sin(angle) * r,
                                    }}
                                    animate={{
                                        scale: [0.5, 1.2, 0.5],
                                        opacity: [0.3, 1, 0.3],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <Star
                                        size={8}
                                        className={`${theme.accentCSS} fill-current`}
                                    />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* === CENTER BADGE === */}
                {(phase === "reveal" || phase === "fadeout") && (
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-5"
                        initial={{ scale: 0, y: 20 }}
                        animate={{
                            scale: phase === "fadeout" ? 0 : 1,
                            y: phase === "fadeout" ? -30 : 0,
                            opacity: phase === "fadeout" ? 0 : 1,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                            duration: phase === "fadeout" ? 0.6 : 0.5,
                        }}
                    >
                        {/* Level icon with premium gold medallion glow */}
                        <motion.div
                            className="relative"
                            animate={{ rotate: [0, -4, 4, -4, 0] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="absolute inset-0 rounded-full blur-2xl opacity-40 bg-amber-500/35 scale-150" />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 dark:from-amber-500 dark:via-yellow-400 dark:to-amber-600 flex items-center justify-center shadow-[0_10px_35px_rgba(245,158,11,0.3)] relative border-2 border-white/20">
                                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 opacity-80" />
                                <LevelIcon
                                    size={40}
                                    className="text-white relative z-10 drop-shadow-md"
                                />
                            </div>
                        </motion.div>

                        {/* Text card */}
                        <motion.div
                            className={cn(
                                "text-center rounded-lg px-8 py-7 border shadow-[0_20px_50px_rgba(245,158,11,0.15)] max-w-md backdrop-blur-md transition-all duration-300 relative overflow-hidden",
                                "bg-[#FCF9F2]/95 border-amber-500/25 text-gray-900",
                                "dark:bg-[#151411]/95 dark:border-amber-500/10 dark:text-white"
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            {/* Ambient dot pattern */}
                            <div className="absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center">
                                {/* Level Up Pill */}
                                <motion.div
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] mb-3"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <Star
                                        size={12}
                                        className="text-amber-600 dark:text-amber-400 fill-current animate-pulse"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
                                        Level Up!
                                    </span>
                                    <Star
                                        size={12}
                                        className="text-amber-600 dark:text-amber-400 fill-current animate-pulse"
                                    />
                                </motion.div>

                                {/* Level Title with metallic gold gradient */}
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 bg-clip-text text-transparent mb-1 filter drop-shadow-sm">
                                    Level {levelOrder}
                                </h2>

                                <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200 mt-1">
                                    {theme.heading}
                                </p>

                                <div className="mt-4 max-w-sm mx-auto space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed flex items-center justify-center gap-1.5">
                                        <Sparkles size={16} className="text-gold shrink-0" />
                                        <span>{theme.message}</span>
                                    </p>

                                    {/* Sleek gold-accented divider */}
                                    <div className="h-px w-full bg-amber-500/10 dark:bg-amber-400/5" />

                                    <p className="text-sm text-gray-500 dark:text-gray-400/90 leading-relaxed italic px-4">
                                        &ldquo;{theme.quote}&rdquo;
                                    </p>

                                    {/* Decorative Gold Badge for CTA */}
                                    <div className="mt-2 p-3.5 rounded-lg bg-amber-500/5 dark:bg-amber-400/[0.02] border border-amber-500/10 dark:border-amber-400/10 flex items-center justify-center gap-2">
                                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                                            {theme.cta}
                                        </span>
                                    </div>
                                </div>

                                {/* Dismiss button for replay mode */}
                                {!autoDismiss && phase === "reveal" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDismiss}
                                        className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white text-xs font-bold transition-all border border-black/5 dark:border-white/10 hover:scale-105 h-auto"
                                    >
                                        <X size={12} />
                                        Tap to close
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* === FLOATING MINI STARS (ambient) === */}
                {phase === "reveal" &&
                    Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={`float-${i}`}
                            className="absolute"
                            style={{
                                left: `${10 + Math.random() * 80}%`,
                                top: `${10 + Math.random() * 80}%`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 0.8, 0],
                                scale: [0, 1, 0],
                                y: [0, -40 - Math.random() * 60],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 1.5,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "easeInOut",
                            }}
                        >
                            <Star
                                size={6 + Math.random() * 6}
                                className={`${theme.accentCSS} opacity-60 fill-current opacity-40`}
                            />
                        </motion.div>
                    ))}
            </motion.div>
        </AnimatePresence>
    );
}
