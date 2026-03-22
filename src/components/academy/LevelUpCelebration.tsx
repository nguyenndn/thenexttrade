"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
    Trophy, Star, Sparkles, BookOpen, Layers, BarChart3,
    TrendingUp, Target, Globe, Compass, Map, Shield, Brain, Rocket, X
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
    gradient: string;       // badge gradient
    glowColor: string;      // rgba glow
    accentCSS: string;      // tailwind text color for subtitle
    ringColor: string;      // shockwave ring border
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
        accentCSS: "text-blue-400",
        ringColor: "border-blue-400",
        confettiPalette: ["#3b82f6", "#06b6d4", "#60a5fa", "#22d3ee", "#38bdf8", "#67e8f9"],
        heading: "First Steps Complete!",
        message: "You've taken the leap! Welcome to the world of Forex trading. This is just the beginning of an incredible journey.",
        quote: "Every expert was once a beginner. You've just proven you have what it takes.",
        cta: "🌟 The foundations await — keep building!",
    },
    2: {
        icon: Layers,
        gradient: "from-cyan-400 via-teal-400 to-cyan-500",
        glowColor: "rgba(6,182,212,0.5)",
        accentCSS: "text-cyan-400",
        ringColor: "border-cyan-400",
        confettiPalette: ["#06b6d4", "#14b8a6", "#22d3ee", "#2dd4bf", "#67e8f9", "#5eead4"],
        heading: "Foundations Built!",
        message: "Your trading foundation is rock solid! You now understand brokers, analysis types, and chart basics.",
        quote: "A strong foundation is the secret behind every great trader's success.",
        cta: "📊 Time to read the charts like a pro!",
    },
    3: {
        icon: BarChart3,
        gradient: "from-teal-400 via-emerald-400 to-teal-500",
        glowColor: "rgba(20,184,166,0.5)",
        accentCSS: "text-teal-400",
        ringColor: "border-teal-400",
        confettiPalette: ["#14b8a6", "#10b981", "#2dd4bf", "#34d399", "#5eead4", "#6ee7b7"],
        heading: "Chart Master!",
        message: "Support, resistance, candlesticks, Fibonacci — you can now read the market's language fluently!",
        quote: "The charts tell a story. You've just learned to listen.",
        cta: "🔍 Patterns are everywhere — time to hunt them!",
    },
    4: {
        icon: TrendingUp,
        gradient: "from-emerald-400 via-green-400 to-emerald-500",
        glowColor: "rgba(16,185,129,0.5)",
        accentCSS: "text-emerald-400",
        ringColor: "border-emerald-400",
        confettiPalette: ["#10b981", "#22c55e", "#34d399", "#4ade80", "#6ee7b7", "#86efac"],
        heading: "Pattern Hunter!",
        message: "You've mastered the art of recognizing chart patterns. The market holds fewer secrets from you now.",
        quote: "In every chart, there's a pattern waiting to be discovered by those who know where to look.",
        cta: "🎯 Ready to build winning strategies!",
    },
    5: {
        icon: Target,
        gradient: "from-green-400 via-lime-400 to-green-500",
        glowColor: "rgba(34,197,94,0.5)",
        accentCSS: "text-green-400",
        ringColor: "border-green-400",
        confettiPalette: ["#22c55e", "#84cc16", "#4ade80", "#a3e635", "#86efac", "#bef264"],
        heading: "Strategy Architect!",
        message: "You now think in systems, not just trades. Your strategic mindset sets you apart from 90% of traders.",
        quote: "A plan is the bridge between where you are and where you want to be.",
        cta: "🌍 Global markets are calling!",
    },
    6: {
        icon: Globe,
        gradient: "from-amber-400 via-yellow-400 to-amber-500",
        glowColor: "rgba(245,158,11,0.5)",
        accentCSS: "text-amber-400",
        ringColor: "border-amber-400",
        confettiPalette: ["#f59e0b", "#eab308", "#fbbf24", "#facc15", "#fcd34d", "#fde047"],
        heading: "Market Scholar!",
        message: "Fundamentals, economics, global events — you now see the bigger picture that moves the markets.",
        quote: "Understanding the 'why' behind price movement is the mark of a true market scholar.",
        cta: "🧭 Navigate the global landscape!",
    },
    7: {
        icon: Compass,
        gradient: "from-orange-400 via-amber-400 to-orange-500",
        glowColor: "rgba(249,115,22,0.5)",
        accentCSS: "text-orange-400",
        ringColor: "border-orange-400",
        confettiPalette: ["#f97316", "#f59e0b", "#fb923c", "#fbbf24", "#fdba74", "#fcd34d"],
        heading: "Global Thinker!",
        message: "You think globally and trade wisely. Cross-market correlations and intermarket analysis are your new tools.",
        quote: "The best traders don't just watch one market — they see the connections between all of them.",
        cta: "⚙️ Time to build your trading system!",
    },
    8: {
        icon: Map,
        gradient: "from-rose-400 via-pink-400 to-rose-500",
        glowColor: "rgba(244,63,94,0.5)",
        accentCSS: "text-rose-400",
        ringColor: "border-rose-400",
        confettiPalette: ["#f43f5e", "#ec4899", "#fb7185", "#f472b6", "#fda4af", "#f9a8d4"],
        heading: "System Builder!",
        message: "You've built a complete trading system — from entry to exit, from rules to execution. This is elite territory.",
        quote: "A trading system isn't just a set of rules — it's your competitive edge in the market.",
        cta: "🛡️ Protect your capital — master risk!",
    },
    9: {
        icon: Shield,
        gradient: "from-red-400 via-orange-400 to-red-500",
        glowColor: "rgba(239,68,68,0.5)",
        accentCSS: "text-red-400",
        ringColor: "border-red-400",
        confettiPalette: ["#ef4444", "#f97316", "#f87171", "#fb923c", "#fca5a5", "#fdba74"],
        heading: "Risk Manager!",
        message: "Capital preservation is the ultimate skill. You now trade with discipline, precision, and confidence.",
        quote: "It's not about how much you make — it's about how well you protect what you have.",
        cta: "🧠 Master the final frontier — your mind!",
    },
    10: {
        icon: Brain,
        gradient: "from-indigo-400 via-violet-400 to-indigo-500",
        glowColor: "rgba(129,140,248,0.5)",
        accentCSS: "text-indigo-400",
        ringColor: "border-indigo-400",
        confettiPalette: ["#818cf8", "#a78bfa", "#6366f1", "#8b5cf6", "#a5b4fc", "#c4b5fd"],
        heading: "Mind Master!",
        message: "Trading psychology conquered! Fear, greed, discipline — you've mastered the mental game that defeats most traders.",
        quote: "The market is a mirror — master yourself, and you master the market.",
        cta: "🚀 You're ready for launch!",
    },
    11: {
        icon: Rocket,
        gradient: "from-pink-400 via-rose-400 to-pink-500",
        glowColor: "rgba(236,72,153,0.5)",
        accentCSS: "text-pink-400",
        ringColor: "border-pink-400",
        confettiPalette: ["#ec4899", "#f43f5e", "#f472b6", "#fb7185", "#f9a8d4", "#fda4af"],
        heading: "🏆 LEGENDARY — Full Academy Complete!",
        message: "You've completed the entire Academy! You are now equipped with the knowledge, strategy, and mindset of a professional trader.",
        quote: "This isn't the end — it's the beginning of your real trading career. Now go make it happen!",
        cta: "💎 You are a TheNextTrade Graduate!",
    },
};

const DEFAULT_THEME: LevelTheme = {
    icon: Trophy,
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    glowColor: "rgba(245,158,11,0.5)",
    accentCSS: "text-amber-400",
    ringColor: "border-primary",
    confettiPalette: ["#10b981", "#06b6d4", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899"],
    heading: "Level Complete!",
    message: "Great work! You're making incredible progress on your trading journey.",
    quote: "Patience is the key — the most exciting knowledge is waiting for you ahead.",
    cta: "🚀 Next level unlocked — Keep conquering!",
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
        return { id: i, endX: Math.cos(angle) * distance, endY: Math.sin(angle) * distance, size: Math.random() * 4 + 2, delay: Math.random() * 0.2 };
    });
}

function ConfettiPiece({ piece }: { piece: ReturnType<typeof generateConfetti>[0] }) {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{
                left: `${piece.x}%`,
                bottom: "50%",
                width: piece.size,
                height: piece.shape === "circle" ? piece.size : piece.size * 1.5,
                backgroundColor: piece.shape !== "triangle" ? piece.color : "transparent",
                borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "square" ? "2px" : "0",
                borderLeft: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
                borderRight: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
                borderBottom: piece.shape === "triangle" ? `${piece.size}px solid ${piece.color}` : undefined,
            }}
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{
                y: [0, piece.velocityY, piece.velocityY + 800],
                x: [0, piece.velocityX * 0.5, piece.velocityX],
                opacity: [0, 1, 1, 0],
                rotate: [0, piece.angle, piece.angle * 3],
            }}
            transition={{ duration: piece.duration, delay: piece.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
    );
}

/* ── Main Component ─────────────────────── */
export function LevelUpCelebration({ isActive, levelOrder, levelTitle, autoDismiss = true, onComplete }: LevelUpCelebrationProps) {
    const [phase, setPhase] = useState<"idle" | "burst" | "reveal" | "fadeout">("idle");
    const theme = LEVEL_THEMES[levelOrder] || DEFAULT_THEME;
    const LevelIcon = theme.icon;

    const confetti = useMemo(() => generateConfetti(80, theme.confettiPalette), [theme.confettiPalette]);
    const stars = useMemo(() => generateStars(24), []);

    const handleDismiss = useCallback(() => {
        setPhase("fadeout");
        setTimeout(() => { setPhase("idle"); onComplete(); }, 800);
    }, [onComplete]);

    useEffect(() => {
        if (!isActive) { setPhase("idle"); return; }
        setPhase("burst");
        const t1 = setTimeout(() => setPhase("reveal"), 400);

        if (autoDismiss) {
            const t2 = setTimeout(() => setPhase("fadeout"), 3800);
            const t3 = setTimeout(() => { setPhase("idle"); onComplete(); }, 4600);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }

        return () => { clearTimeout(t1); };
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
                onClick={!autoDismiss && phase === "reveal" ? handleDismiss : undefined}
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
                                animate={{ scale: [0, 8 + i * 3], opacity: [0.8, 0] }}
                                transition={{ duration: 1.2, delay, ease: "easeOut" }}
                            />
                        ))}
                    </>
                )}

                {/* === RADIAL LIGHT BURST (themed glow) === */}
                {(phase === "burst" || phase === "reveal") && (
                    <motion.div
                        className="absolute w-64 h-64 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${theme.glowColor} 0%, ${theme.glowColor.replace('0.5', '0.2')} 40%, transparent 70%)`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 4, 3], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                )}

                {/* === STAR BURST PARTICLES === */}
                {(phase === "burst" || phase === "reveal") && stars.map((star) => (
                    <motion.div
                        key={`star-${star.id}`}
                        className="absolute w-1 h-1 rounded-full"
                        style={{ backgroundColor: theme.confettiPalette[0], boxShadow: `0 0 6px 2px ${theme.glowColor}` }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{ x: [0, star.endX], y: [0, star.endY], scale: [0, star.size, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, delay: star.delay + 0.1, ease: "easeOut" }}
                    />
                ))}

                {/* === CONFETTI (themed palette) === */}
                {(phase === "burst" || phase === "reveal") && confetti.map((piece) => (
                    <ConfettiPiece key={`confetti-${piece.id}`} piece={piece} />
                ))}

                {/* === SPARKLE RING === */}
                {phase === "reveal" && (
                    <motion.div
                        className="absolute"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const r = 140;
                            return (
                                <motion.div
                                    key={`sparkle-${i}`}
                                    className="absolute"
                                    style={{ left: Math.cos(angle) * r, top: Math.sin(angle) * r }}
                                    animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                >
                                    <Star size={8} className={`${theme.accentCSS} fill-current`} />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* === CENTER BADGE === */}
                {(phase === "reveal" || phase === "fadeout") && (
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-4"
                        initial={{ scale: 0, y: 20 }}
                        animate={{
                            scale: phase === "fadeout" ? 0 : 1,
                            y: phase === "fadeout" ? -30 : 0,
                            opacity: phase === "fadeout" ? 0 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, duration: phase === "fadeout" ? 0.6 : 0.5 }}
                    >
                        {/* Level icon with themed glow */}
                        <motion.div
                            className="relative"
                            animate={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ backgroundColor: theme.confettiPalette[0], transform: "scale(2.5)" }} />
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-2xl relative`}
                                style={{ boxShadow: `0 10px 40px ${theme.glowColor}` }}>
                                <div className={`absolute inset-[3px] rounded-full bg-gradient-to-br ${theme.gradient} opacity-80`} />
                                <LevelIcon size={40} className="text-white relative z-10 drop-shadow-lg" />
                            </div>
                        </motion.div>

                        {/* Text card */}
                        <motion.div
                            className="text-center bg-black/60 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10 shadow-2xl max-w-md"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            <motion.div
                                className="flex items-center gap-2 justify-center mb-1"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sparkles size={16} className={theme.accentCSS} />
                                <span className={`text-xs font-bold uppercase tracking-[0.3em] ${theme.accentCSS}`}
                                    style={{ textShadow: `0 0 8px ${theme.glowColor}` }}>
                                    Level Up!
                                </span>
                                <Sparkles size={16} className={theme.accentCSS} />
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white"
                                style={{ textShadow: `0 2px 10px ${theme.glowColor}` }}>
                                Level {levelOrder}
                            </h2>
                            <p className={`text-lg font-semibold ${theme.accentCSS} mt-1`}>
                                {theme.heading}
                            </p>
                            <div className="mt-4 max-w-sm mx-auto space-y-2.5">
                                <p className="text-sm text-white font-medium leading-relaxed">
                                    🎉 {theme.message}
                                </p>
                                <p className="text-sm text-gray-200 leading-relaxed italic">
                                    &ldquo;{theme.quote}&rdquo;
                                </p>
                                <p className={`text-sm ${theme.accentCSS} font-semibold mt-1`}>
                                    {theme.cta}
                                </p>
                            </div>
                            {/* Dismiss button for replay mode */}
                            {!autoDismiss && phase === "reveal" && (
                                <button
                                    onClick={handleDismiss}
                                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-colors border border-white/10"
                                >
                                    <X size={12} />
                                    Tap to close
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* === FLOATING MINI STARS (ambient) === */}
                {phase === "reveal" && Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={`float-${i}`}
                        className="absolute"
                        style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0], y: [0, -40 - Math.random() * 60] }}
                        transition={{ duration: 2 + Math.random() * 1.5, repeat: Infinity, delay: Math.random() * 2, ease: "easeInOut" }}
                    >
                        <Star size={6 + Math.random() * 6} className={`${theme.accentCSS} opacity-60 fill-current opacity-40`} />
                    </motion.div>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}
