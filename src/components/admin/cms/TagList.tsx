
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Edit2, Trash2, Plus, Tag as TagIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagModal } from "./TagModal";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load tags");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
};

interface Tag {
    id: string;
    name: string;
    slug: string;
}

export default function TagList() {
    const { data: tags = [], isLoading, mutate } = useSWR("/api/tags", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Failed to load tags");
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [tagToDeleteId, setTagToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (id: string) => {
        setTagToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!tagToDeleteId) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tags/${tagToDeleteId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }

            toast.success("Tag deleted");
            setIsConfirmOpen(false);
            setTagToDeleteId(null);
            await mutate();
        } catch (error: any) {
            toast.error(error.message);
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTag(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex flex-col gap-2">
                    <h1 className="sr-only">Tag Management</h1>
                <p className="text-base text-primary font-bold">
                        Manage tags for organizing content.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Add New
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">Name</th>
                                <th className="px-6 py-5">Slug</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3 text-gray-500">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tags.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <TagIcon size={40} className="mb-3 opacity-30" />
                                            <p className="font-bold text-gray-900 dark:text-gray-300">No tags found</p>
                                            <p className="text-sm mt-1 mb-4">Create your first tag to start classifying content.</p>
                                            <Button onClick={handleCreate} variant="outline" className="text-sm shadow-sm transition-transform active:scale-95">
                                                <Plus size={16} className="mr-1.5" /> Create Tag
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tags.map((tag) => (
                                    <tr key={tag.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-white">
                                            {tag.name}
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 font-mono text-xs">{tag.slug}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:ring-0 focus-visible:ring-0"
                                                            aria-label="Open Actions"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#1E2028] z-[100]">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleEdit(tag)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 focus:bg-gray-50 dark:focus:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors outline-none"
                                                        >
                                                            <Edit2 size={14} className="text-gray-400" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                                        <DropdownMenuItem 
                                                            onClick={() => confirmDelete(tag.id)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors outline-none"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TagModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => mutate()}
                tag={editingTag}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Tag"
                description="Are you sure you want to delete this tag? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete"}
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setTagToDeleteId(null);
                }}
                variant="danger"
            />
        </div>
    );
}
