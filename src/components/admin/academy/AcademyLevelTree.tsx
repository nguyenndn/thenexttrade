import { useState } from "react";
import Link from "next/link";
import {
    ChevronDown,
    ChevronRight,
    BookOpen,
    Layers,
    FileText,
    ExternalLink,
    HelpCircle,
    Edit,
    Trash,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminLevel, getStageForLevel } from "./types";

interface AcademyLevelTreeProps {
    levels: AdminLevel[];
    onEdit: (level: AdminLevel) => void;
    onDelete: (levelId: string) => void;
}

export function AcademyLevelTree({
    levels,
    onEdit,
    onDelete,
}: AcademyLevelTreeProps) {
    // Keep track of expanded level IDs
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(() => {
        // Expand first 2 levels by default for good preview
        return new Set(levels.slice(0, 2).map((l) => l.id));
    });

    const toggleLevel = (id: string) => {
        setExpandedLevels((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedLevels(new Set(levels.map((l) => l.id)));
    };

    const collapseAll = () => {
        setExpandedLevels(new Set());
    };

    return (
        <div className="space-y-3">
            {/* Tree Control Header */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Hierarchical Curriculum Breakdown ({levels.length} Levels)
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={expandAll}
                        className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white gap-1"
                    >
                        <Maximize2 size={12} />
                        <span>Expand All</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={collapseAll}
                        className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white gap-1"
                    >
                        <Minimize2 size={12} />
                        <span>Collapse All</span>
                    </Button>
                </div>
            </div>

            {/* Tree Nodes */}
            <div className="space-y-3">
                {levels.map((level) => {
                    const isExpanded = expandedLevels.has(level.id);
                    const stage = getStageForLevel(level.order);
                    const isPublic =
                        (level.accessLevel || "PUBLIC").toUpperCase() ===
                        "PUBLIC";
                    const modules = level.modules || [];
                    const moduleCount =
                        level._count?.modules || modules.length || 0;
                    const totalLessons = modules.reduce(
                        (acc, m) =>
                            acc + (m._count?.lessons || m.lessons?.length || 0),
                        0
                    );

                    return (
                        <div
                            key={level.id}
                            className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-all"
                        >
                            {/* Level Node Header */}
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/40 dark:bg-white/[0.01]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleLevel(level.id)}
                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                        aria-label={
                                            isExpanded
                                                ? "Collapse level"
                                                : "Expand level"
                                        }
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={18} />
                                        ) : (
                                            <ChevronRight size={18} />
                                        )}
                                    </button>

                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center font-black text-cyan-600 dark:text-cyan-400 text-xs shrink-0">
                                        {String(level.order).padStart(2, "0")}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                {level.title}
                                            </h4>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeClass}`}
                                            >
                                                {stage.name}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    isPublic
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                                }`}
                                            >
                                                {isPublic
                                                    ? "Public"
                                                    : "Member"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Counts & Actions */}
                                <div className="flex items-center gap-3 pl-8 md:pl-0">
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Layers size={13} />
                                            {moduleCount} Modules
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen size={13} />
                                            {totalLessons} Lessons
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/admin/academy/${level.id}`}
                                            className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            Manage
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(level)}
                                            className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg"
                                            aria-label="Edit level"
                                        >
                                            <Edit size={13} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(level.id)}
                                            className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-lg"
                                            aria-label="Delete level"
                                        >
                                            <Trash size={13} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Collapsible Children: Modules and Lessons */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                                    {modules.length === 0 ? (
                                        <div className="py-4 px-12 text-xs text-gray-400 italic">
                                            No curriculum modules yet in this
                                            level.
                                        </div>
                                    ) : (
                                        modules.map((mod) => (
                                            <div
                                                key={mod.id}
                                                className="pl-8 sm:pl-12 pr-4 py-3 bg-white dark:bg-[#151925]"
                                            >
                                                {/* Module row */}
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 flex items-center justify-center shrink-0">
                                                            {mod.order}
                                                        </span>
                                                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                                                            {mod.title}
                                                        </span>
                                                        {mod.quiz?.id && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                <HelpCircle
                                                                    size={10}
                                                                />
                                                                Quiz
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {mod.lessons?.length ||
                                                            0}{" "}
                                                        lessons
                                                    </span>
                                                </div>

                                                {/* Lessons under module */}
                                                {mod.lessons &&
                                                    mod.lessons.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pl-6 pt-1">
                                                            {mod.lessons.map(
                                                                (les) => (
                                                                    <div
                                                                        key={
                                                                            les.id
                                                                        }
                                                                        className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 group transition-all"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                                                            </span>
                                                                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium group-hover:text-primary transition-colors">
                                                                                {les.order}
                                                                                .{" "}
                                                                                {
                                                                                    les.title
                                                                                }
                                                                            </span>
                                                                        </div>

                                                                        <Link
                                                                            href={`/admin/academy/lessons/${les.id}/edit`}
                                                                            className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-opacity shrink-0"
                                                                            title="Edit Lesson Content"
                                                                        >
                                                                            <span>
                                                                                Edit
                                                                            </span>
                                                                            <ExternalLink
                                                                                size={
                                                                                    11
                                                                                }
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
