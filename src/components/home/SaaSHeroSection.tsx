"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

interface SaaSHeroSectionProps {
    isLoggedIn: boolean;
}

/**
 * The rotating half of the headline. Every phrase names a *behavior* the
 * trader recognises in themselves — never an outcome we cannot deliver.
 * "Consistent Profit" used to live here and was the single most damaging
 * string on the page: an experienced trader reads it as a promise no tool
 * can keep and leaves. Do not put a profit claim back into this array.
 *
 * All phrases are kept under ~18 characters so the headline holds one line
 * at lg+ and the layout never reflows mid-type.
 */
export const PHRASES = ["not doing it.", "moving the stop.", "revenge sizing.", "breaking your own rules."];

const TYPE_SPEED_MS = 75;
const DELETE_SPEED_MS = 40;
const HOLD_MS = 2200;

export function SaaSHeroSection({ isLoggedIn }: SaaSHeroSectionProps) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const currentPhrase = PHRASES[phraseIndex];

    useEffect(() => {
        const fullText = currentPhrase;
        let timer: NodeJS.Timeout;

        if (!isDeleting) {
            if (displayedText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length + 1));
                }, TYPE_SPEED_MS);
            } else {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, HOLD_MS);
            }
        } else {
            if (displayedText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length - 1));
                }, DELETE_SPEED_MS);
            } else {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
            }
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, phraseIndex, currentPhrase]);

    return (
        <div className="pt-24 sm:pt-32 md:pt-36 pb-6 sm:pb-8 bg-white dark:bg-transparent relative overflow-hidden text-center isolate">
            {/* Golden Glow Atmosphere Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(245,158,11,0.10),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(245,158,11,0.14),transparent_75%)] pointer-events-none" />

            {/* Technical Grid Pattern */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 -z-10 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

            {/* Golden Firefly Particles */}
            <DynamicFirefly color="gold" count={20} />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
                {/* Headline — leads with the problem, not a promise of profit.
                    We never claim the tool makes money; we claim it shows the
                    trader what they keep doing wrong. */}
                <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[68px] 2xl:text-[76px] font-black text-gray-900 dark:text-white tracking-tight leading-[1.15] sm:leading-[1.08] mb-7 sm:mb-6 max-w-5xl">
                    <span className="block whitespace-nowrap">
                        You already know what to do.
                    </span>
                    <span className="block mt-1 sm:mt-2 min-h-[1.15em] sm:whitespace-nowrap">
                        You keep{" "}
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-gold to-amber-600 dark:from-gold dark:via-yellow-300 dark:to-amber-400 drop-shadow-sm pb-[0.25em] -mb-[0.25em]">
                            {displayedText || " "}
                        </span>
                        <span
                            className="inline-block w-2 sm:w-2.5 md:w-3 h-7 sm:h-8 md:h-10 lg:h-11 xl:h-13 2xl:h-14 ml-1.5 align-middle rounded-full bg-gold shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                            style={{ animation: "terminalBlink 1s infinite" }}
                        />
                    </span>
                </h1>

                {/* Supporting Copy */}
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-3xl sm:max-w-4xl font-normal sm:font-medium animate-in fade-in duration-1000 text-center [text-wrap:balance]">
                    The strategy was never the problem — the revenge size after a red day
                    was.{" "}
                    <br className="hidden sm:inline" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                        We sync every MT5 trade and show you the exact moment discipline broke.
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
                        <Button className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine">
                            <span>
                                {isLoggedIn ? "Open My Journal" : "Sync My MT5 — Free"}
                            </span>
                            <ArrowRight
                                size={14}
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
                            className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 hover:border-gold hover:text-amber-600 dark:hover:text-gold font-extrabold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap"
                        >
                            <span>See How It Works</span>
                            <ArrowDown
                                size={14}
                                className="text-amber-500 dark:text-gold group-hover:translate-y-1 transition-transform duration-300 shrink-0"
                            />
                        </Button>
                    </a>
                </div>

                {/* Trust Strip — stating who pays us is the page's strongest
                    trust asset, so it stays above the fold. "Free forever" was
                    dropped: nothing here is forever-free-with-no-condition, and
                    the $200 broker deposit is explained in full further down.
                    Claiming more than we do costs more trust than it buys. */}
                <div className="mt-6 sm:mt-7 flex flex-col items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 animate-in fade-in duration-1000">
                    <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        We&apos;re paid by the broker, not by you
                    </span>
                    <span className="text-center">
                        Zero front-running · Your funds stay in your own name
                    </span>
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
