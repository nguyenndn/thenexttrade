import { Layers, BookOpen, FileText, CheckCircle2 } from "lucide-react";
import { AdminLevel } from "./types";

interface AcademyStatsGridProps {
    levels: AdminLevel[];
}

export function AcademyStatsGrid({ levels }: AcademyStatsGridProps) {
    const totalLevels = levels.length;
    const publicLevels = levels.filter(
        (l) => (l.accessLevel || "PUBLIC").toUpperCase() === "PUBLIC"
    ).length;
    const memberLevels = totalLevels - publicLevels;

    const totalModules = levels.reduce(
        (acc, l) => acc + (l._count?.modules || l.modules?.length || 0),
        0
    );

    let totalLessons = 0;
    let publishedLessons = 0;
    let totalQuizzes = 0;

    levels.forEach((lvl) => {
        lvl.modules?.forEach((mod) => {
            if (mod.quiz?.id) totalQuizzes += 1;
            const lessonCount = mod._count?.lessons || mod.lessons?.length || 0;
            totalLessons += lessonCount;
            mod.lessons?.forEach((les) => {
                if (les.status === "published") {
                    publishedLessons += 1;
                }
            });
        });
    });

    // Fallback if lessons array was not deeply fetched
    if (publishedLessons === 0 && totalLessons > 0) {
        publishedLessons = totalLessons;
    }

    const avgModulesPerLevel =
        totalLevels > 0 ? (totalModules / totalLevels).toFixed(1) : "0";

    const stats = [
        {
            label: "Course Levels",
            value: totalLevels,
            meta: `${publicLevels} Public · ${memberLevels} Member`,
            icon: Layers,
            iconColor: "text-blue-500 dark:text-blue-400",
            iconBg: "bg-blue-500/10",
        },
        {
            label: "Curriculum Modules",
            value: totalModules,
            meta: `Avg ${avgModulesPerLevel} modules / level`,
            icon: BookOpen,
            iconColor: "text-cyan-500 dark:text-cyan-400",
            iconBg: "bg-cyan-500/10",
        },
        {
            label: "Active Lessons",
            value: totalLessons,
            meta: `${publishedLessons} published lessons`,
            hasPulsingDot: true,
            icon: FileText,
            iconColor: "text-emerald-500 dark:text-emerald-400",
            iconBg: "bg-emerald-500/10",
        },
        {
            label: "Module Quizzes",
            value: totalQuizzes,
            meta: "Interactive evaluations",
            icon: CheckCircle2,
            iconColor: "text-amber-500 dark:text-amber-400",
            iconBg: "bg-amber-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={idx}
                        className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </span>
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}
                            >
                                <Icon size={18} className={stat.iconColor} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                                {stat.value}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            {stat.hasPulsingDot && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                {stat.meta}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
