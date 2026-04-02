"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Reply, Trash2, MoreHorizontal } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
// Checking file list, I passed `Button.tsx`, `Modal.tsx`. I don't see Dropdown.
// I'll stick to a simple Delete button if it's my own comment.

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

export function CommentList({ comments, articleId, currentUser, onRefresh }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No comments yet. Be the first to share your thoughts!
            </div>
        );
    }

    return (
        <div className="space-y-6">
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

function CommentItem({ comment, articleId, currentUser, onRefresh }: {
    comment: Comment;
    articleId: string;
    currentUser?: User | null;
    onRefresh: () => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const isAuthor = currentUser?.id === comment.user.id;
    // We can't easily check for Admin here without passing 'role' in currentUser.
    // For now, only Author can delete on UI side, API handles the rest.

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/comments/${comment.id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Comment deleted");
            onRefresh();
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Could not delete comment"));
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden relative border border-gray-100 dark:border-white/10">
                    {comment.user.image ? (
                        <Image
                            src={comment.user.image}
                            alt={comment.user.name || "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                            {comment.user.name?.charAt(0) || "U"}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-700 dark:text-gray-100">
                        {comment.user.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>

                <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                    {comment.content}
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <Button
                        variant="ghost"
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1.5 h-auto px-2 py-1 text-gray-600 hover:text-primary transition-colors font-medium"
                    >
                        <Reply size={14} />
                        Reply
                    </Button>

                    {isAuthor && (
                        <Button
                            variant="ghost"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-1.5 h-auto px-2 py-1 text-gray-500 hover:text-red-500 transition-colors font-medium"
                        >
                            <Trash2 size={14} />
                            Delete
                        </Button>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-4 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-2 fade-in duration-200">
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
                        />
                    </div>
                )}

                {/* Recursively render replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-6 ml-2 pl-4 border-l border-gray-100 dark:border-white/5 space-y-6">
                        {comment.replies.map(reply => (
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
                description="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
