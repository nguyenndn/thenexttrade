"use client";

import { useState, useEffect } from "react";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { Loader2, MessageSquare } from "lucide-react";

interface User {
    id: string;
    name: string | null;
    image: string | null;
}

interface CommentSectionProps {
    articleId: string;
    currentUser: User | null;
    initialComments?: any[];
}

export function CommentSection({ articleId, currentUser, initialComments = [] }: CommentSectionProps) {
    const [comments, setComments] = useState(initialComments);
    const [isLoading, setIsLoading] = useState(initialComments.length === 0);

    // If initialComments provided, we don't need to load immediately, unless we want to refresh.
    // Actually, if we pass initialComments, isLoading can be false. 
    // But we might want to check for updates? Typically for comments, SSG/SSR data is fresh enough.
    // Let's set isLoading to false if we have initialComments.

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/articles/${articleId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialComments.length > 0) {
            setIsLoading(false);
        } else {
            fetchComments();
        }
    }, [articleId]);

    return (
        <section id="comments" className="py-12 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#00C888]/10 rounded-xl text-[#00C888]">
                    <MessageSquare size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Discussion ({comments.length})
                </h2>
            </div>

            {/* Main Comment Form */}
            <div className="mb-10 bg-gray-50/50 dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                {currentUser ? (
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-white/10 overflow-hidden relative">
                                {currentUser.image ? (
                                    <img src={currentUser.image} alt={currentUser.name || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                        {currentUser.name?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <CommentForm
                                articleId={articleId}
                                onSuccess={fetchComments}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">Log in to join the discussion</p>
                        <a
                            href={`/auth/login?next=/articles/${articleId}`}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#00C888] hover:bg-[#00B078] text-white rounded-xl font-medium transition-all shadow-lg shadow-[#00C888]/20"
                        >
                            Log In
                        </a>
                    </div>
                )}
            </div>

            {/* Comments List */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-[#00C888]" />
                </div>
            ) : (
                <CommentList
                    comments={comments}
                    articleId={articleId}
                    currentUser={currentUser}
                    onRefresh={fetchComments}
                />
            )}
        </section>
    );
}
