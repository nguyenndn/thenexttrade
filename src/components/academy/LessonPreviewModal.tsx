"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, PlayCircle, BookOpen, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface LessonPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonSlug: string | null;
    moduleTitle: string;
}

interface LessonPreview {
    title: string;
    content: string;
    duration: number | null;
    moduleTitle: string;
    levelTitle: string;
}

export function LessonPreviewModal({ isOpen, onClose, lessonSlug, moduleTitle }: LessonPreviewModalProps) {
    const [lesson, setLesson] = useState<LessonPreview | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !lessonSlug) { setLesson(null); return; }
        setLoading(true);
        fetch(`/api/academy/lessons/${lessonSlug}/preview`)
            .then(res => res.json())
            .then(data => { setLesson(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [isOpen, lessonSlug]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-primary/15 to-cyan-500/15 px-6 py-5 flex-shrink-0">
                                <button
                                    onClick={onClose}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 dark:bg-black/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-black/40 transition-colors"
                                >
                                    <X size={16} className="text-gray-700 dark:text-gray-300" />
                                </button>

                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={20} className="text-primary animate-spin" />
                                        <span className="text-sm text-gray-600">Loading preview...</span>
                                    </div>
                                ) : lesson ? (
                                    <>
                                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                            {lesson.levelTitle} › {lesson.moduleTitle}
                                        </p>
                                        <h3 className="text-lg font-black text-gray-700 dark:text-white">
                                            {lesson.title}
                                        </h3>
                                        {lesson.duration && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                                                <Clock size={12} />
                                                <span>{lesson.duration} min read</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <h3 className="text-lg font-black text-gray-700 dark:text-white">{moduleTitle}</h3>
                                )}
                            </div>

                            {/* Content Preview — scrollable */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 size={32} className="text-primary animate-spin" />
                                    </div>
                                ) : lesson ? (
                                    <div className="px-6 py-5">
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Content preview unavailable</p>
                                    </div>
                                )}
                            </div>

                            {/* CTA Footer */}
                            <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 flex-shrink-0 space-y-3">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10">
                                    <Lock size={13} className="text-amber-500 flex-shrink-0" />
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                        Sign up for free to read full lessons & track progress
                                    </p>
                                </div>

                                <Link
                                    href="/auth/signup"
                                    className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                                >
                                    <PlayCircle size={18} />
                                    Sign Up to Continue
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="flex items-center justify-center w-full px-6 py-2 rounded-full text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors"
                                >
                                    Already have an account? Sign In
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
