"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

interface SaaSHeroSectionProps {
    isLoggedIn: boolean;
}

const PHRASES = [
    {
        text: "Your Next Move",
        gradient:
            "from-amber-400 via-gold to-yellow-400 dark:from-amber-300 dark:via-yellow-300 dark:to-amber-400",
        cursor: "bg-amber-500 dark:bg-gold shadow-[0_0_12px_rgba(245,158,11,0.8)]",
    },
    {
        text: "Consistent Profit",
        gradient:
            "from-emerald-400 via-teal-300 to-cyan-400 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300",
        cursor: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    },
    {
        text: "Disciplined Execution",
        gradient:
            "from-blue-400 via-cyan-300 to-indigo-400 dark:from-blue-300 dark:via-cyan-300 dark:to-indigo-300",
        cursor: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]",
    },
    {
        text: "Your AI Edge",
        gradient:
            "from-purple-400 via-fuchsia-400 to-pink-400 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300",
        cursor: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    },
];

export function SaaSHeroSection({ isLoggedIn }: SaaSHeroSectionProps) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const currentPhrase = PHRASES[phraseIndex];

    useEffect(() => {
        const fullText = currentPhrase.text;
        let timer: NodeJS.Timeout;

        if (!isDeleting) {
            if (displayedText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length + 1));
                }, 75);
            } else {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, 2200);
            }
        } else {
            if (displayedText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length - 1));
                }, 40);
            } else {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
            }
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, phraseIndex, currentPhrase.text]);

    return (
        <div className="pt-24 sm:pt-32 md:pt-36 pb-6 sm:pb-8 bg-white dark:bg-transparent relative overflow-hidden text-center isolate">
            {/* Golden Glow Atmosphere Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(245,158,11,0.12),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(245,158,11,0.18),transparent_75%)] pointer-events-none" />

            {/* Technical Grid Pattern */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 -z-10 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

            {/* Golden Firefly Particles */}
            <DynamicFirefly color="gold" count={50} />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
                {/* Grand Headline with Dynamic Typewriter Console */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[68px] 2xl:text-[76px] font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-6 max-w-5xl">
                    Turn Your Trade History <br className="hidden sm:inline" />
                    <span className="block mt-1 sm:mt-2 min-h-[1.15em] sm:whitespace-nowrap">
                        Into{" "}
                        <span
                            className={`inline-block text-transparent bg-clip-text bg-gradient-to-r ${currentPhrase.gradient} drop-shadow-sm`}
                        >
                            {displayedText || "\u00A0"}
                        </span>
                        <span
                            className={`inline-block w-2 sm:w-2.5 md:w-3 h-7 sm:h-8 md:h-10 lg:h-11 xl:h-13 2xl:h-14 ml-1.5 align-middle rounded-full ${currentPhrase.cursor}`}
                            style={{
                                animation: "terminalBlink 1s infinite",
                            }}
                        />
                    </span>
                </h1>

                {/* Supporting Copy */}
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-3xl sm:max-w-4xl font-normal sm:font-medium animate-in fade-in duration-1000 text-center [text-wrap:balance]">
                    TheNextTrade exists to solve the greatest paradox in financial markets:{" "}
                    <br className="hidden sm:inline" />
                    traders know what to do, but fail to execute it consistently.{" "}
                    <br className="hidden sm:inline" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                        We build systems that make discipline inevitable.
                    </span>
                </p>

                {/* Dual Primary CTAs (2-Path Intent) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto animate-in fade-in duration-1000">
                    <Link
                        href={
                            isLoggedIn
                                ? "/dashboard"
                                : "/auth/signup?intent=TRADE_FIRST&source=homepage_hero"
                        }
                        className="w-full sm:w-auto group"
                    >
                        <Button className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-xl bg-gold hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 whitespace-normal sm:whitespace-nowrap animate-btn-shine">
                            <span>
                                {isLoggedIn
                                    ? "Open Journal"
                                    : "Start Free Journal (Sync MT5)"}
                            </span>
                            <ArrowRight
                                size={17}
                                className="group-hover:translate-x-1 transition-transform duration-300 shrink-0"
                            />
                        </Button>
                    </Link>

                    <a
                        href="#how-it-works"
                        className="w-full sm:w-auto group"
                    >
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-xl border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 hover:border-gold hover:text-amber-600 dark:hover:text-gold font-bold text-sm sm:text-base shadow-sm transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 whitespace-normal sm:whitespace-nowrap"
                        >
                            <span>See How It Works</span>
                            <ArrowDown
                                size={16}
                                className="text-amber-500 dark:text-gold group-hover:translate-y-1 transition-transform duration-300 shrink-0"
                            />
                        </Button>
                    </a>
                </div>
            </section>

            <style>{`
                @keyframes terminalBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
