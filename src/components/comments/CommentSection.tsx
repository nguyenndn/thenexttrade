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
        <section id="comments" className="py-10 px-6 sm:px-8 bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <MessageSquare size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Discussion ({comments.length})
                    </h2>
                </div>
                
                {currentUser && (
                    <button 
                        onClick={() => document.getElementById('comment-form-box')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm font-bold text-primary hover:underline"
                    >
                        Write a comment &darr;
                    </button>
                )}
            </div>

            {/* Comments List */}
            <div className="mb-12">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : (
                    <CommentList
                        comments={comments}
                        articleId={articleId}
                        currentUser={currentUser}
                        onRefresh={fetchComments}
                    />
                )}
            </div>

            {/* Main Comment Form */}
            <div id="comment-form-box" className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/5 scroll-mt-32 shadow-sm">
                {currentUser ? (
                    <CommentForm
                        articleId={articleId}
                        onSuccess={fetchComments}
                        userName={currentUser.name}
                    />
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">Log in to join the discussion</p>
                        <a
                            href={`/auth/login?next=/articles/${articleId}#comment-form-box`}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary hover:bg-[#00B078] text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
                        >
                            Log In
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
