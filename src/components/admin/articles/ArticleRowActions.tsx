"use client";

import { Trash2, Edit2, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function ArticleRowActions({ article }: { article: { id: string, slug: string } }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/articles/${article.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Article deleted successfully");
                router.refresh();
            } else {
                toast.error("Failed to delete article");
                setIsConfirmOpen(false);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Error deleting article"));
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Article Actions" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <MoreHorizontal size={18} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
                    <DropdownMenuItem onClick={() => window.open(`/articles/${article.slug}`, '_blank')} className="font-medium cursor-pointer rounded-lg mx-1 my-1">
                        <ArrowUpRight size={14} className="mr-2 text-gray-400" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/articles/${article.id}/edit`)} className="font-medium cursor-pointer rounded-lg mx-1 my-1">
                        <Edit2 size={14} className="mr-2 text-gray-400" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={confirmDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1">
                        <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Article"
                description="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </>
    );
}
