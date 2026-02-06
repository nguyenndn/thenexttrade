"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Search, Trash2, ExternalLink, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";

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
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/comments");
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments);
            } else {
                toast.error("Failed to load comments");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching comments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        setIsDeleting(id);
        try {
            const res = await fetch(`/api/comments/${id}`, {
                method: "DELETE" // Reusing the existing delete API which checks for Admin role
            });

            if (res.ok) {
                toast.success("Comment deleted");
                setComments(comments.filter(c => c.id !== id));
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to delete");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting comment");
        } finally {
            setIsDeleting(null);
        }
    };

    // Filter comments locally for now (can move to API if list gets huge)
    const filteredComments = comments.filter(c =>
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.article?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-[#00C888] rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Comments
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Manage user discussions and moderation.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 bg-white dark:bg-[#0B0E14] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <PremiumInput
                        icon={Search}
                        placeholder="Search comments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#00C888]" size={32} />
                </div>
            ) : filteredComments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#0B0E14] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No comments found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or check back later.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#0B0E14] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Comment</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Context</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredComments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group"
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
                                                onClick={() => handleDelete(comment.id)}
                                                disabled={isDeleting === comment.id}
                                                isLoading={isDeleting === comment.id}
                                                variant="ghost"
                                                className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400"
                                                title="Delete Comment"
                                            >
                                                {isDeleting !== comment.id && <Trash2 size={18} />}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
