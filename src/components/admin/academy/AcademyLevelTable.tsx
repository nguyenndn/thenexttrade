import Link from "next/link";
import { Edit, Trash, ArrowRight, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminLevel, getStageForLevel } from "./types";

interface AcademyLevelTableProps {
    levels: AdminLevel[];
    onEdit: (level: AdminLevel) => void;
    onDelete: (levelId: string) => void;
}

export function AcademyLevelTable({
    levels,
    onEdit,
    onDelete,
}: AcademyLevelTableProps) {
    return (
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/75 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="py-3.5 px-4">Level</th>
                            <th className="py-3.5 px-4">Stage</th>
                            <th className="py-3.5 px-4">Access Tier</th>
                            <th className="py-3.5 px-4 text-center">Modules</th>
                            <th className="py-3.5 px-4 text-center">Lessons</th>
                            <th className="py-3.5 px-4 text-center">Quizzes</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {levels.map((level) => {
                            const stage = getStageForLevel(level.order);
                            const isPublic =
                                (level.accessLevel || "PUBLIC").toUpperCase() ===
                                "PUBLIC";
                            const moduleCount =
                                level._count?.modules ||
                                level.modules?.length ||
                                0;
                            let lessonCount = 0;
                            let quizCount = 0;

                            level.modules?.forEach((m) => {
                                lessonCount +=
                                    m._count?.lessons || m.lessons?.length || 0;
                                if (m.quiz?.id) quizCount += 1;
                            });

                            return (
                                <tr
                                    key={level.id}
                                    className="group hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    {/* Level & Order */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0 font-black text-cyan-600 dark:text-cyan-400 text-xs">
                                                {String(level.order).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-[260px]">
                                                <Link
                                                    href={`/admin/academy/${level.id}`}
                                                    className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate block text-sm"
                                                >
                                                    {level.title}
                                                </Link>
                                                {level.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                        {level.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Stage */}
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeClass}`}
                                        >
                                            {stage.name}
                                        </span>
                                    </td>

                                    {/* Access Tier */}
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                                isPublic
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                            }`}
                                        >
                                            {isPublic
                                                ? "Public Access"
                                                : "Member Only"}
                                        </span>
                                    </td>

                                    {/* Modules Count */}
                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            <Layers
                                                size={13}
                                                className="text-gray-400"
                                            />
                                            <span>{moduleCount}</span>
                                        </div>
                                    </td>

                                    {/* Lessons Count */}
                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                            </span>
                                            <BookOpen
                                                size={13}
                                                className="text-gray-400"
                                            />
                                            <span>{lessonCount}</span>
                                        </div>
                                    </td>

                                    {/* Quizzes */}
                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="text-xs font-medium text-gray-500">
                                            {quizCount > 0
                                                ? `${quizCount} Quizzes`
                                                : "—"}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-4 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1">
                                            <Link
                                                href={`/admin/academy/${level.id}`}
                                                className="p-1.5 text-gray-400 hover:text-primary dark:hover:text-white rounded-lg transition-colors inline-flex items-center"
                                                title="Manage Content"
                                                aria-label="Manage content"
                                            >
                                                <ArrowRight size={15} />
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(level)}
                                                className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg"
                                                title="Edit Level"
                                                aria-label="Edit level"
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    onDelete(level.id)
                                                }
                                                className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-lg"
                                                title="Delete Level"
                                                aria-label="Delete level"
                                            >
                                                <Trash size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
