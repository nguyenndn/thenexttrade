"use client";

import Link from "next/link";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import {
    ArrowRight,
    MessageCircle,
    ShieldCheck,
    Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function NewsletterSection() {
    return (
        <div className="relative overflow-hidden border-t border-dashboard bg-white dark:bg-transparent">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_65%_70%_at_50%_50%,#000_68%,transparent_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

            <section className="relative z-10 mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-gold/25 bg-gradient-to-br from-white via-gold/[0.04] to-amber-50/70 px-5 py-8 text-center shadow-[0_18px_55px_rgba(245,158,11,0.08)] dark:from-white/[0.04] dark:via-gold/[0.04] dark:to-white/[0.02] sm:px-8 sm:py-10">
                    <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                        <Zap size={12} strokeWidth={2.7} />
                        Ready when you are
                    </div>

                    <h2 className="mx-auto max-w-3xl font-heading text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Build your trading edge today
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                        Create your free account, auto-sync your MT5 terminal, and
                        identify behavioral risk leaks before your next session.
                    </p>

                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/auth/signup?source=home_final_cta&intent=track"
                            className={cn(
                                buttonVariants({ variant: "gold", size: "smd" }),
                                "gap-2 font-extrabold shadow-[0_10px_24px_rgba(245,158,11,0.22)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)]"
                            )}
                        >
                            Start Free Journal
                            <Zap size={14} className="text-yellow-200" />
                        </Link>

                        <a
                            href={TELEGRAM_CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "smd" }),
                                "gap-2 font-extrabold border-gray-200 bg-white text-gray-800 shadow-sm transition-all duration-300 hover:border-[#2AABEE]/40 hover:text-[#2AABEE] hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                            )}
                        >
                            <MessageCircle size={14} />
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
