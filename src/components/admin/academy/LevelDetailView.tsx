"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus, BookOpen, FileText, Layers, ChevronDown, ChevronRight,
    Edit, Trash2, MoreVertical, ArrowLeft, Clock, GripVertical, ListChecks
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateModuleModal } from "./CreateModuleModal";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

interface Lesson {
    id: string;
    title: string;
    slug: string;
    order: number;
    duration: number | null;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: Lesson[];
    _count: { lessons: number };
    quiz: { id: string } | null;
}

interface Level {
    id: string;
    title: string;
    description: string | null;
    order: number;
    modules: Module[];
}

interface LevelDetailViewProps {
    level: Level;
}

export function LevelDetailView({ level }: LevelDetailViewProps) {
    const router = useRouter();
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(level.modules.map(m => m.id)) // Expand all by default
    );
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "lesson"; id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isQuizLoading, setIsQuizLoading] = useState<string | null>(null);
    const [draggedLesson, setDraggedLesson] = useState<string | null>(null);
    const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const confirmDelete = (type: "module" | "lesson", id: string, title: string) => {
        setDeleteTarget({ type, id, title });
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        try {
            const endpoint = deleteTarget.type === "module"
                ? `/api/academy/modules/${deleteTarget.id}`
                : `/api/academy/lessons/${deleteTarget.id}`;

            const res = await fetch(endpoint, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");

            toast.success(`${deleteTarget.type === "module" ? "Module" : "Lesson"} deleted`);
            setIsConfirmOpen(false);
            setDeleteTarget(null);
            router.refresh();
        } catch {
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleManageQuiz = async (moduleId: string, quizId: string | null) => {
        if (quizId) {
            router.push(`/admin/academy/quiz/${quizId}`);
            return;
        }
        setIsQuizLoading(moduleId);
        try {
            const mod = level.modules.find(m => m.id === moduleId);
            const res = await fetch('/api/academy/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${mod?.title || 'Module'} Quiz`,
                    moduleId,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create quiz');
            }
            const quiz = await res.json();
            router.push(`/admin/academy/quiz/${quiz.id}`);
        } catch (e: any) {
            toast.error(e.message || 'Failed to create quiz');
        } finally {
            setIsQuizLoading(null);
        }
    };

    const handleLessonDragStart = (lessonId: string) => {
        setDraggedLesson(lessonId);
    };

    const handleLessonDragOver = (e: React.DragEvent, lessonId: string) => {
        e.preventDefault();
        if (draggedLesson && draggedLesson !== lessonId) {
            setDragOverLesson(lessonId);
        }
    };

    const handleLessonDrop = async (moduleId: string) => {
        if (!draggedLesson || !dragOverLesson || draggedLesson === dragOverLesson) {
            setDraggedLesson(null);
            setDragOverLesson(null);
            return;
        }

        const module = level.modules.find(m => m.id === moduleId);
        if (!module) return;

        const lessons = [...module.lessons];
        const fromIndex = lessons.findIndex(l => l.id === draggedLesson);
        const toIndex = lessons.findIndex(l => l.id === dragOverLesson);

        if (fromIndex === -1 || toIndex === -1) return;

        const [moved] = lessons.splice(fromIndex, 1);
        lessons.splice(toIndex, 0, moved);

        const items = lessons.map((l, i) => ({ id: l.id, order: i + 1 }));

        setDraggedLesson(null);
        setDragOverLesson(null);

        try {
            const res = await fetch('/api/academy/lessons/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (!res.ok) throw new Error();
            toast.success('Lesson order updated');
            router.refresh();
        } catch {
            toast.error('Failed to reorder lessons');
        }
    };

    const totalLessons = level.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalDuration = level.modules.reduce(
        (sum, m) => sum + m.lessons.reduce((ls, l) => ls + (l.duration || 0), 0), 0
    );

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title={level.title}
                description={level.description || "No description"}
                backHref="/admin/academy"
            >
                <Button
                    onClick={() => setIsCreateModuleOpen(true)}
                    className="flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add Module
                </Button>
            </AdminPageHeader>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <Layers size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{level.modules.length}</p>
                        <p className="text-xs text-gray-500">Modules</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLessons}</p>
                        <p className="text-xs text-gray-500">Lessons</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDuration}m</p>
                        <p className="text-xs text-gray-500">Total Duration</p>
                    </div>
                </div>
            </div>

            {/* Modules Accordion */}
            <div className="space-y-4">
                {level.modules.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#151925] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                        <Layers size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Modules Yet</h3>
                        <p className="text-gray-500 text-sm mb-6">Start by creating your first module for this level.</p>
                        <Button onClick={() => setIsCreateModuleOpen(true)} className="gap-2">
                            <Plus size={18} /> Create Module
                        </Button>
                    </div>
                ) : (
                    level.modules.map((module, mIndex) => (
                        <div
                            key={module.id}
                            className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden"
                        >
                            {/* Module Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                onClick={() => toggleModule(module.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                                        {mIndex + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{module.title}</h3>
                                        <p className="text-xs text-gray-500">
                                            {module._count.lessons} lessons
                                            {module.description && ` · ${module.description}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Actions */}
                                    <div onClick={e => e.stopPropagation()}>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 h-8 w-8">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-1" align="end">
                                                <Link
                                                    href={`/admin/academy/lessons/create?moduleId=${module.id}`}
                                                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
                                                >
                                                    <Plus size={14} /> Add Lesson
                                                </Link>
                                                <button
                                                    onClick={() => handleManageQuiz(module.id, module.quiz?.id || null)}
                                                    disabled={isQuizLoading === module.id}
                                                    className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                                                >
                                                    <ListChecks size={14} />
                                                    {isQuizLoading === module.id ? 'Creating...' : module.quiz ? 'Edit Quiz' : 'Add Quiz'}
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => confirmDelete("module", module.id, module.title)}
                                                    className="w-full flex items-center justify-start gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-left"
                                                >
                                                    <Trash2 size={14} /> Delete Module
                                                </Button>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Chevron */}
                                    {expandedModules.has(module.id)
                                        ? <ChevronDown size={18} className="text-gray-400" />
                                        : <ChevronRight size={18} className="text-gray-400" />
                                    }
                                </div>
                            </div>

                            {/* Lessons List (collapsible) */}
                            {expandedModules.has(module.id) && (
                                <div className="border-t border-gray-100 dark:border-white/5">
                                    {module.lessons.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-sm text-gray-400 mb-3">No lessons in this module yet</p>
                                            <Link href={`/admin/academy/lessons/create?moduleId=${module.id}`}>
                                                <Button variant="outline" size="sm" className="gap-1 text-xs">
                                                    <Plus size={14} /> Add First Lesson
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                                            {module.lessons.map((lesson, lIndex) => (
                                                <div
                                                    key={lesson.id}
                                                    draggable
                                                    onDragStart={() => handleLessonDragStart(lesson.id)}
                                                    onDragOver={(e) => handleLessonDragOver(e, lesson.id)}
                                                    onDrop={() => handleLessonDrop(module.id)}
                                                    onDragEnd={() => { setDraggedLesson(null); setDragOverLesson(null); }}
                                                    className={`flex items-center justify-between px-4 py-3 pl-12 group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-grab active:cursor-grabbing ${
                                                        draggedLesson === lesson.id ? 'opacity-40' : ''
                                                    } ${
                                                        dragOverLesson === lesson.id ? 'border-t-2 border-primary bg-primary/5' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical size={14} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                        <span className="text-xs font-mono text-gray-400 w-5">{lIndex + 1}.</span>
                                                        <FileText size={16} className="text-blue-400 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{lesson.title}</span>
                                                        {lesson.duration && (
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Clock size={12} /> {lesson.duration}m
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/admin/academy/lessons/${lesson.id}/edit`}>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary">
                                                                <Edit size={14} />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                                                            onClick={() => confirmDelete("lesson", lesson.id, lesson.title)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="px-4 py-2 pl-16">
                                                <Link href={`/admin/academy/lessons/create?moduleId=${module.id}`}>
                                                    <Button variant="ghost" className="text-xs text-primary font-bold h-auto p-1 hover:bg-transparent hover:underline">
                                                        + Add Lesson
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Module Modal */}
            <CreateModuleModal
                isOpen={isCreateModuleOpen}
                onClose={() => setIsCreateModuleOpen(false)}
                levelId={level.id}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={`Delete ${deleteTarget?.type === "module" ? "Module" : "Lesson"}`}
                description={`Are you sure you want to delete "${deleteTarget?.title}"? ${deleteTarget?.type === "module" ? "All lessons inside will be deleted." : ""} This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => { if (!isDeleting) { setIsConfirmOpen(false); setDeleteTarget(null); } }}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
