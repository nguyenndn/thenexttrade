import Link from "next/link";
import {
    MoreVertical,
    Edit,
    Trash,
    ArrowRight,
    Layers,
    BookOpen,
    HelpCircle,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AdminLevel, getStageForLevel } from "./types";

interface AcademyLevelCardProps {
    level: AdminLevel;
    onEdit: (level: AdminLevel) => void;
    onDelete: (levelId: string) => void;
}

export function AcademyLevelCard({
    level,
    onEdit,
    onDelete,
}: AcademyLevelCardProps) {
    const stage = getStageForLevel(level.order);
    const isPublic = (level.accessLevel || "PUBLIC").toUpperCase() === "PUBLIC";

    const moduleCount = level._count?.modules || level.modules?.length || 0;
    let lessonCount = 0;
    let quizCount = 0;

    level.modules?.forEach((m) => {
        lessonCount += m._count?.lessons || m.lessons?.length || 0;
        if (m.quiz?.id) quizCount += 1;
    });

    const previewModules = level.modules?.slice(0, 3) || [];
    const remainingModules = Math.max(0, moduleCount - previewModules.length);

    return (
        <div className="group flex flex-col justify-between bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all">
            {/* Header: Order, Stage, Access & Actions */}
            <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                            <span className="text-base font-black text-cyan-600 dark:text-cyan-400">
                                {String(level.order).padStart(2, "0")}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeClass}`}
                                >
                                    {stage.name}
                                </span>
                                <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                        isPublic
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                    }`}
                                >
                                    {isPublic ? "Public Access" : "Member Only"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Popover */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg"
                                    aria-label="Level actions menu"
                                >
                                    <MoreVertical size={16} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-36 p-1 rounded-xl"
                                align="end"
                            >
                                <Button
                                    variant="ghost"
                                    onClick={() => onEdit(level)}
                                    className="w-full flex items-center justify-start gap-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg py-1.5 h-auto font-medium"
                                >
                                    <Edit size={14} className="text-gray-500" />
                                    <span>Edit Level</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => onDelete(level.id)}
                                    className="w-full flex items-center justify-start gap-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg py-1.5 h-auto font-medium"
                                >
                                    <Trash size={14} />
                                    <span>Delete</span>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Level Title & Description */}
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight mb-1.5 group-hover:text-primary transition-colors">
                    {level.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] leading-relaxed mb-4">
                    {level.description || "No curriculum description provided."}
                </p>

                {/* 2x2 Specs Matrix Card */}
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] mb-4 overflow-hidden">
                    {/* Matrix Cell 1: Modules */}
                    <div className="p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
                            <Layers size={13} />
                            <span>Modules</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {moduleCount} Modules
                        </div>
                    </div>

                    {/* Matrix Cell 2: Lessons */}
                    <div className="p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
                            <BookOpen size={13} />
                            <span>Lessons</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {lessonCount} Lessons
                        </div>
                    </div>

                    {/* Matrix Cell 3: Quizzes */}
                    <div className="p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
                            <HelpCircle size={13} />
                            <span>Evaluations</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {quizCount > 0 ? `${quizCount} Quizzes` : "None"}
                        </div>
                    </div>

                    {/* Matrix Cell 4: Access */}
                    <div className="p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
                            <Shield size={13} />
                            <span>Tier</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {isPublic ? "Free Tier" : "Pro Member"}
                        </div>
                    </div>
                </div>

                {/* Module Preview Tags */}
                {previewModules.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Included Modules
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {previewModules.map((mod) => (
                                <span
                                    key={mod.id}
                                    className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 truncate max-w-[180px]"
                                    title={mod.title}
                                >
                                    {mod.title}
                                </span>
                            ))}
                            {remainingModules > 0 && (
                                <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-lg">
                                    +{remainingModules} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                    Order index #{level.order}
                </span>
                <Link
                    href={`/admin/academy/${level.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-emerald-500 transition-colors"
                >
                    <span>Manage Content</span>
                    <ArrowRight size={13} />
                </Link>
            </div>
        </div>
    );
}
