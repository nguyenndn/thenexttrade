import Link from "next/link";
import { LayoutDashboard, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { WeeklyCoachMock } from "@/components/home/weekly-coach/WeeklyCoachMock";
import { getRetentionHook } from "@/config/retention-hooks";

interface WeeklyCoachSectionProps {
    isLoggedIn: boolean;
}

/**
 * WeeklyCoachSection — retention hook #1.
 *
 * Answers: "Why come back next week?" — because every week you get a fresh
 * audit + one prescribed rule to practice across 10 trades.
 *
 * Server Component: no interactivity needed. The mock is static.
 * CTA is conditional on auth state (spec AC-02).
 */
export function WeeklyCoachSection({ isLoggedIn }: WeeklyCoachSectionProps) {
    const hook = getRetentionHook("weekly-coach");
    if (!hook) return null;

    const ctaHref = isLoggedIn ? "/dashboard" : hook.href;
    const ctaText = isLoggedIn ? "View This Week's Report" : hook.ctaText;

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-gray-200 dark:border-white/10">
            <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title={hook.title}
                    highlight={hook.highlight}
                    description={hook.description}
                    icon={hook.icon}
                    className="mb-8 sm:mb-10"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                    {/* Left: narrative + CTA */}
                    <div className="lg:col-span-5 flex flex-col gap-4 text-left">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-black text-gold">
                                    1
                                </span>
                                <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                        Audit — every Sunday
                                    </p>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Your journal is scanned for the single
                                        costliest execution leak of the week.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-black text-gold">
                                    2
                                </span>
                                <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                        Prescribe — one rule
                                    </p>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                        You get one hard rule to practice across
                                        your next 10 trades. No overwhelm.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-black text-gold">
                                    3
                                </span>
                                <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                        Practice — 10-trade sprint
                                    </p>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Track completion. When the sprint ends,
                                        a new audit begins.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href={ctaHref}
                            className={cn(
                                buttonVariants({ variant: "gold", size: "smd" }),
                                "w-full sm:w-auto rounded-lg font-extrabold shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 group"
                            )}
                        >
                            {ctaText}
                            {isLoggedIn ? (
                                <LayoutDashboard
                                    size={14}
                                    className="text-yellow-200 group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <Zap
                                    size={14}
                                    className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                                />
                            )}
                        </Link>
                    </div>

                    {/* Right: sample report mock */}
                    <div className="lg:col-span-7">
                        <WeeklyCoachMock />
                    </div>
                </div>
            </section>
        </div>
    );
}
