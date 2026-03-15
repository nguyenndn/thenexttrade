"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { MessageSquare, Search, Trash2, ExternalLink, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
};

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        name: string | null;
        image: string | null;
        email: string | null;
    };
    article?: {
        title: string;
        slug: string;
    };
    lesson?: {
        title: string;
        slug: string;
    };
}

export default function AdminCommentsPage() {
    const { data, error, isLoading, mutate } = useSWR("/api/admin/comments", fetcher, {
        onError: (err) => {
            console.error(err);
            toast.error(err.message || "Error fetching comments");
        }
    });

    const comments: Comment[] = data?.comments || [];

    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

    const confirmDelete = (comment: Comment) => {
        setCommentToDelete(comment);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!commentToDelete) return;

        setIsDeleting(commentToDelete.id);
        setIsConfirmOpen(false);
        try {
            const res = await fetch(`/api/comments/${commentToDelete.id}`, {
                method: "DELETE" // Reusing the existing delete API which checks for Admin role
            });

            if (res.ok) {
                toast.success("Comment deleted");
                await mutate(); // Revalidate SWR cache
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to delete");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Error deleting comment"));
        } finally {
            setIsDeleting(null);
            setCommentToDelete(null);
        }
    };

    // Filter comments locally for now (can move to API if list gets huge)
    const filteredComments = useMemo(() => {
        return comments.filter(c =>
            c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.article?.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [comments, searchQuery]);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Comments"
                description="Manage user discussions and moderation."
            />

            {/* Data Wrapper */}
            <div className="space-y-6">
                {/* 1. Toolbar Card */}
                <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                    <div className="flex-1 w-full max-w-md">
                        <PremiumInput
                            icon={Search}
                            placeholder="Search comments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* 2. Data Table Card */}
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                <tr>
                                    <th className="py-4 px-6 border-b border-gray-100 dark:border-white/5">Author</th>
                                    <th className="py-4 px-6 border-b border-gray-100 dark:border-white/5 w-1/2">Comment</th>
                                    <th className="py-4 px-6 border-b border-gray-100 dark:border-white/5">Context</th>
                                    <th className="py-4 px-6 border-b border-gray-100 dark:border-white/5 text-right">Actions</th>
                                </tr>
                            </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded-md" />
                                                    <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded-md" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-2">
                                                <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded-md" />
                                                <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/5 rounded-md" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded-md" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="h-8 w-8 ml-auto bg-gray-200 dark:bg-white/10 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredComments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No comments found</h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Try adjusting your search or check back later.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredComments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                                                    {comment.user.image ? (
                                                        <img src={comment.user.image} alt={comment.user.name || "User"} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {(comment.user.name || "U").charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                                        {comment.user.name || "Anonymous"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                                        {comment.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2 mb-1">
                                                {comment.content}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {comment.article ? (
                                                <Link
                                                    href={`/articles/${comment.article.slug}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline max-w-[200px] truncate"
                                                >
                                                    <ExternalLink size={14} />
                                                    {comment.article.title}
                                                </Link>
                                            ) : comment.lesson ? (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 max-w-[200px] truncate">
                                                    <ExternalLink size={14} />
                                                    {comment.lesson.title}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Unknown Context</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button
                                                onClick={() => confirmDelete(comment)}
                                                disabled={isDeleting === comment.id}
                                                isLoading={isDeleting === comment.id}
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 p-0 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400"
                                                aria-label={`Delete comment from ${comment.user.name || "Unknown"}`}
                                            >
                                                {isDeleting !== comment.id && <Trash2 size={18} aria-hidden="true" />}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Comment"
                description={`Are you sure you want to delete the comment by ${commentToDelete?.user.name || "this user"}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setCommentToDelete(null);
                }}
                variant="danger"
            />
        </div>
    );
}
