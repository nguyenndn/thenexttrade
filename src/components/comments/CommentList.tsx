"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Reply, Trash2, MessageSquareCode, ShieldAlert } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface User {
    id: string;
    name: string | null;
    image: string | null;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string | Date;
    user: User;
    replies?: Comment[];
    parentId?: string | null;
}

interface CommentListProps {
    comments: Comment[];
    articleId: string;
    currentUser?: User | null;
    onRefresh: () => void;
}

export function CommentList({
    comments,
    articleId,
    currentUser,
    onRefresh,
}: CommentListProps) {
    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-14 px-6 border-2 border-dashed border-dashboard rounded-3xl bg-gray-50/20 dark:bg-[#0b0d14]/20 relative overflow-hidden transition-all duration-300">
                {/* Glowing subtle circles in empty state */}
                <div className="absolute w-36 h-36 bg-primary/5 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-emerald-500/10 dark:from-primary/20 dark:to-emerald-500/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center mb-5 text-primary shadow-[0_4px_20px_rgba(16,185,129,0.06)] animate-bounce duration-1000">
                        <MessageSquareCode size={24} className="stroke-[2]" />
                    </div>

                    <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-200 mb-2 font-sans tracking-tight">
                        No comments yet
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
                        Be the first to share your expert insights, strategies,
                        or questions. Connect with other traders!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    articleId={articleId}
                    currentUser={currentUser}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}

function CommentItem({
    comment,
    articleId,
    currentUser,
    onRefresh,
}: {
    comment: Comment;
    articleId: string;
    currentUser?: User | null;
    onRefresh: () => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const isAuthor = currentUser?.id === comment.user.id;

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/comments/${comment.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Comment deleted");
            onRefresh();
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Could not delete comment"
            );
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <div className="flex gap-4 group/item relative">
            {/* Visual indicator bar on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/0 group-hover/item:bg-primary/20 dark:group-hover/item:bg-primary/40 -ml-4 rounded-full transition-all duration-300" />

            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#161822] overflow-hidden relative border border-dashboard/50 ring-2 ring-primary/0 group-hover/item:ring-primary/20 dark:group-hover/item:ring-primary/30 p-0.5 transition-all duration-300 hover:scale-105">
                    {comment.user.image ? (
                        <Image
                            src={comment.user.image}
                            alt={comment.user.name || "User"}
                            fill
                            className="object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm bg-primary/10 rounded-full">
                            {comment.user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                {/* Header detail */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100 hover:text-primary transition-colors font-sans cursor-pointer">
                        {comment.user.name || "Anonymous User"}
                    </span>
                    {comment.user.id === currentUser?.id && (
                        <span className="inline-flex items-center px-1.5 py-0.2 bg-primary/10 text-primary text-[8px] uppercase font-black rounded tracking-wider border border-primary/15">
                            You
                        </span>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        •{" "}
                        {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                        })}
                    </span>
                </div>

                {/* Content body */}
                <div className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed font-sans pr-2">
                    {comment.content}
                </div>

                {/* Interaction actions */}
                <div className="flex items-center gap-4 mt-2.5">
                    <Button
                        variant="ghost"
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1.5 h-auto px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200"
                    >
                        <Reply size={12} className="stroke-[2.5]" />
                        Reply
                    </Button>

                    {isAuthor && (
                        <Button
                            variant="ghost"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-1.5 h-auto px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-full transition-all duration-200"
                        >
                            <Trash2 size={12} className="stroke-[2.5]" />
                            Delete
                        </Button>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-4 pl-4 border-l-2 border-primary/20 bg-gray-50/30 dark:bg-white/[0.01] p-4 rounded-xl shadow-inner animate-in slide-in-from-top-2 fade-in duration-300">
                        <CommentForm
                            articleId={articleId}
                            parentId={comment.id}
                            autoFocus
                            placeholder={`Replying to ${comment.user.name}...`}
                            onSuccess={() => {
                                setIsReplying(false);
                                onRefresh();
                            }}
                            onCancel={() => setIsReplying(false)}
                            userName={currentUser?.name}
                            userImage={currentUser?.image}
                        />
                    </div>
                )}

                {/* Recursively render replies with branch lines */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-6 ml-2 sm:ml-4 pl-4 sm:pl-6 border-l border-dashboard/60 space-y-6 relative before:absolute before:left-0 before:top-2 before:bottom-6 before:w-[1px] before:bg-gradient-to-b before:from-gray-200/60 dark:before:from-white/5 before:to-transparent">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                articleId={articleId}
                                currentUser={currentUser}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action is permanent and cannot be undone."
                confirmText="Delete permanently"
                cancelText="Keep comment"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
