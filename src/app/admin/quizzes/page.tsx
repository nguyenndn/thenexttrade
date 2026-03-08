
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ListChecks, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function AdminQuizzesPage() {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetch("/api/quizzes")
            .then(res => res.json())
            .then(data => {
                setQuizzes(data);
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, []);

    const confirmDelete = (id: string) => {
        setQuizToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!quizToDeleteId) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/quizzes/${quizToDeleteId}`, { method: "DELETE" });
            setQuizzes(quizzes.filter(q => q.id !== quizToDeleteId));
            setIsConfirmOpen(false);
            setQuizToDeleteId(null);
        } catch (error) {
            console.error("Failed to delete quiz:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Quiz Management
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Manage assessments and tests.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/quizzes/create"
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00a872] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Add New
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <ListChecks size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Quizzes Found</h3>
                    <p className="text-gray-500 text-sm mb-6">Create your first quiz to test student knowledge.</p>
                    <Link href="/admin/quizzes/create" className="text-primary font-bold hover:underline">
                        Create Quiz Pattern
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="p-4 bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex justify-between items-center group hover:border-cyan-500/50 hover:shadow-md transition-all">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{quiz.title}</h3>
                                <div className="text-xs text-gray-500 flex gap-4 mt-1">
                                    <span>{quiz.description || "No description"}</span>
                                    <span>•</span>
                                    <span>{quiz._count?.questions || 0} Questions</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    onClick={() => confirmDelete(quiz.id)}
                                    variant="ghost"
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all h-auto w-auto"
                                    aria-label="Delete Quiz"
                                >
                                    <Trash2 size={16} />
                                </Button>
                                <Link href={`/admin/quizzes/${quiz.id}`} className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-cyan-500 hover:text-white transition-all">
                                    <Edit size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Quiz"
                description="Are you sure? This will delete all attempts associated with this quiz. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setQuizToDeleteId(null);
                }}
                variant="danger"
            />
        </div>
    );
}
