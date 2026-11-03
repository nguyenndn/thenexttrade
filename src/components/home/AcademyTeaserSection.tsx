import Link from "next/link";
import { BookOpen, GraduationCap, Award, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { getRetentionHook } from "@/config/retention-hooks";

interface AcademyTeaserSectionProps {
    isLoggedIn: boolean;
}

interface LevelCard {
    level: string;
    title: string;
    description: string;
    lessonCount: number;
    icon: LucideIcon;
    accent: string;
}

const LEVELS: LevelCard[] = [
    {
        level: "Level 1",
        title: "Foundations",
        description:
            "Market structure, risk math, and the mechanics every trader must internalize before risking capital.",
        lessonCount: 12,
        icon: BookOpen,
        accent: "text-slate-700 dark:text-slate-300",
    },
    {
        level: "Level 2",
        title: "Execution",
        description:
            "Session profiles, order flow, and the discipline to execute a plan without second-guessing.",
        lessonCount: 18,
        icon: GraduationCap,
        accent: "text-gold",
    },
    {
        level: "Level 3",
        title: "Funded",
        description:
            "Prop firm playbook, scaling rules, and the operational habits of a consistently funded trader.",
        lessonCount: 15,
        icon: Award,
        accent: "text-slate-700 dark:text-slate-300",
    },
];

export function AcademyTeaserSection({
    isLoggedIn,
}: AcademyTeaserSectionProps) {
    const hook = getRetentionHook("academy");
    if (!hook) return null;

    const loggedInHref = "/dashboard";
    const ctaHref = isLoggedIn ? loggedInHref : hook.href;
    const ctaText = isLoggedIn ? "Continue Learning" : hook.ctaText;

    return (
        <div className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent border-t border-gray-200 dark:border-white/10">
            <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title={hook.title}
                    highlight={hook.highlight}
                    description={hook.description}
                    icon={hook.icon}
                    className="mb-8 sm:mb-10"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {LEVELS.map((level) => {
                        const Icon = level.icon;
                        return (
                            <div
                                key={level.level}
                                className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D111C] p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-white/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-mono tabular-nums font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                        {level.level}
                                    </span>
                                    <div className="rounded-lg bg-gray-100 dark:bg-[#151925] p-1.5">
                                        <Icon
                                            size={14}
                                            className={level.accent}
                                            strokeWidth={2.4}
                                        />
                                    </div>
                                </div>
                                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white mb-1.5">
                                    {level.title}
                                </h3>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                                    {level.description}
                                </p>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between font-mono tabular-nums">
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        {level.lessonCount} lessons
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                        {isLoggedIn ? "0 / " + level.lessonCount : "Preview"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <Link
                        href={ctaHref}
                        className={cn(
                            buttonVariants({ variant: "gold", size: "smd" }),
                            "w-full sm:w-auto rounded-lg font-extrabold shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 group"
                        )}
                    >
                        {ctaText}
                        <ArrowRight
                            size={14}
                            className="text-yellow-200 group-hover:translate-x-1 transition-transform duration-300"
                        />
                    </Link>
                </div>
            </section>
        </div>
    );
}
