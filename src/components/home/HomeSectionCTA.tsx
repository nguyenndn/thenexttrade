"use client";

import Link from "next/link";
import {
    ArrowRight,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react";

interface HomeSectionCTAProps {
    isLoggedIn: boolean;
}

export function HomeSectionCTA({ isLoggedIn }: HomeSectionCTAProps) {
    return (
        <div className="relative overflow-hidden border-t border-dashboard bg-white dark:bg-transparent">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_65%_70%_at_50%_50%,#000_68%,transparent_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

            <section className="relative z-10 mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-white via-gold/[0.04] to-amber-50/70 px-5 py-8 text-center shadow-[0_18px_55px_rgba(245,158,11,0.08)] dark:from-white/[0.04] dark:via-gold/[0.04] dark:to-white/[0.02] sm:px-8 sm:py-10">
                    <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                        <Sparkles size={12} strokeWidth={2.7} />
                        Ready when you are
                    </div>

                    <h2 className="mx-auto max-w-3xl font-heading text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Ready to build your trading edge?
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-gray-655 dark:text-gray-300 sm:text-base">
                        Create your free account, sync your first trades, and
                        get your first review path.
                    </p>

                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={
                                isLoggedIn
                                    ? "/dashboard"
                                    : "/auth/signup?source=home_final_cta&intent=track"
                            }
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(245,158,11,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-[0_18px_38px_rgba(245,158,11,0.34)] active:translate-y-0 animate-btn-shine"
                        >
                            <span>
                                {isLoggedIn
                                    ? "Open Dashboard"
                                    : "Start Free Journal"}
                            </span>
                            <Zap size={16} className="text-yellow-200" />
                        </Link>

                        <a
                            href="https://t.me/GoldScalperNinja"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2AABEE]/40 hover:text-[#2AABEE] hover:shadow-md active:translate-y-0 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                        >
                            <MessageCircle size={16} />
                            Join Telegram
                        </a>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck
                                size={13}
                                className="text-emerald-500"
                            />
                            Free account
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />
                        <span className="inline-flex items-center gap-1.5">
                            <ArrowRight size={13} className="text-gold" />
                            Setup in minutes
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />
                        <span className="inline-flex items-center gap-1.5">
                            <MessageCircle
                                size={13}
                                className="text-[#2AABEE]"
                            />
                            GoldScalperNinja community
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}
