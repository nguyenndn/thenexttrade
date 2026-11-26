import Link from "next/link";
import { ArrowRight, HelpCircle, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { cn } from "@/lib/utils";
import { MT5SystemCard } from "./mt5-teaser/MT5SystemCard";
import { TRADING_SYSTEM_ITEMS } from "./mt5-teaser/mt5-suite-data";

export function MT5TeaserCTA() {
    return (
        <div
            id="systems-preview"
            className="relative w-full overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-transparent"
        >
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Manual Trader Co-Pilot & Automated MT5 EAs"
                    highlight="Automated MT5 EAs"
                    description="Size lots in 1 click and sync live trades manually, or run XAU/USD Expert Advisors with hard-coded stop-loss and drawdown controls."
                    className="mb-8"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TRADING_SYSTEM_ITEMS.map((item) => (
                        <MT5SystemCard key={item.href} item={item} />
                    ))}
                </div>

                <div className="mt-7 sm:mt-8 flex flex-col items-center gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
                        <Link
                            href="/trading-systems"
                            className={cn(
                                buttonVariants({ variant: "gold" }),
                                "w-full sm:w-auto min-h-12 px-7 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 animate-btn-shine whitespace-nowrap group"
                            )}
                        >
                            <span>Unlock Automated EAs</span>
                            <ArrowRight
                                size={16}
                                className="group-hover:translate-x-1 transition-transform duration-300"
                            />
                        </Link>

                        <Link
                            href="/trading-systems#how-unlock-works"
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "w-full sm:w-auto min-h-12 px-6 rounded-lg border border-gray-200 dark:border-white/15 hover:border-gold dark:hover:border-gold/60 bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm text-gray-800 dark:text-gray-200 hover:text-amber-600 dark:hover:text-gold font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 whitespace-nowrap group"
                            )}
                        >
                            <HelpCircle
                                size={16}
                                className="shrink-0 text-amber-500 dark:text-gold"
                            />
                            <span>How Unlock Works</span>
                        </Link>
                    </div>

                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                        <ShieldCheck
                            size={14}
                            className="text-emerald-500 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Zero MT5 master password · Capital stays 100% in your
                            broker account · No profit guarantee
                        </span>
                    </p>
                </div>
            </section>
        </div>
    );
}
