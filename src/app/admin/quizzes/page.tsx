
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ListChecks, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminQuizzesPage() {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/quizzes")
            .then(res => res.json())
            .then(data => {
                setQuizzes(data);
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, []);

    const deleteQuiz = async (id: string) => {
        if (!confirm("Are you sure? This will delete all attempts.")) return;
        await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
        setQuizzes(quizzes.filter(q => q.id !== id));
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
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
                <Link
                    href="/admin/quizzes/create"
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00a872] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30 hover:-translate-y-1 active:scale-95 active:translate-y-0"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Add New
                </Link>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#151925] rounded-3xl border border-gray-100 dark:border-white/5">
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
                        <div key={quiz.id} className="p-4 bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:border-cyan-500/50 transition-colors">
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
                                    onClick={() => deleteQuiz(quiz.id)}
                                    variant="ghost"
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all h-auto w-auto"
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
        </div>
    );
}
