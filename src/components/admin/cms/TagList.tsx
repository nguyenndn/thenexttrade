
"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Edit2, Trash2, Plus, Tag as TagIcon, MoreHorizontal, Search, CheckSquare, Square, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
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

export default function TagList({ hideHeader }: { hideHeader?: boolean }) {
    const { data: tags = [], isLoading, mutate } = useSWR("/api/tags", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Failed to load tags");
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");

    // Single Delete State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [tagToDeleteId, setTagToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // Listen for create event from parent
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail === 'tags') handleCreate();
        };
        window.addEventListener('taxonomy-create', handler);
        return () => window.removeEventListener('taxonomy-create', handler);
    }, []);

    // Filter
    const filteredTags = useMemo(() => {
        if (!searchQuery) return tags;
        return tags.filter((t: Tag) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tags, searchQuery]);

    const confirmDelete = (id: string) => {
        setTagToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!tagToDeleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tags/${tagToDeleteId}`, { method: "DELETE" });
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

    // Bulk Selection
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredTags.length && filteredTags.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTags.map((t: Tag) => t.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        setIsBulkLoading(true);
        try {
            const res = await fetch("/api/tags/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (!res.ok) throw new Error("Bulk delete failed");
            toast.success(`Deleted ${selectedIds.size} tags`);
            setSelectedIds(new Set());
            setIsBulkConfirmOpen(false);
            await mutate();
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : "Bulk delete failed");
            setIsBulkConfirmOpen(false);
        } finally {
            setIsBulkLoading(false);
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
        <div className="space-y-4">
            {!hideHeader && (
            <AdminPageHeader
                title="Tags"
                description="Label and filter content with custom tags."
            >
                <Button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add New
                </Button>
            </AdminPageHeader>
            )}

            {/* Toolbar: Search + Bulk Actions */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                <div className="flex flex-1 gap-4 flex-col lg:flex-row justify-between w-full lg:items-center">
                    <div className="flex-1 w-full max-w-md">
                        <PremiumInput
                            icon={Search}
                            placeholder="Search tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-1.5 bg-primary/10 px-4 h-[42px] rounded-xl animate-in fade-in zoom-in-95 text-sm shrink-0">
                            <span className="font-bold text-primary mr-2">{selectedIds.size} selected</span>
                            <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                            <Button
                                variant="ghost"
                                onClick={() => setIsBulkConfirmOpen(true)}
                                disabled={isBulkLoading}
                                className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete Selected"
                            >
                                {isBulkLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-600 font-bold tracking-wider">
                            <tr>
                                <th className="pl-6 pr-4 py-5 w-14">
                                    <Button variant="ghost" onClick={toggleSelectAll} className="w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-500 hover:text-gray-600 hover:bg-transparent" aria-label="Select All">
                                        {selectedIds.size === filteredTags.length && filteredTags.length > 0 ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
                                    </Button>
                                </th>
                                <th className="px-6 py-5">Name</th>
                                <th className="px-6 py-5">Slug</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3 text-gray-600">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTags.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-600">
                                            <TagIcon size={40} className="mb-3 opacity-30" />
                                            <p className="font-bold text-gray-700 dark:text-gray-300">No tags found</p>
                                            <p className="text-sm mt-1 mb-4">{searchQuery ? 'Try adjusting your search.' : 'Create your first tag to start classifying content.'}</p>
                                            {!searchQuery && (
                                                <Button onClick={handleCreate} variant="outline" className="text-sm shadow-sm transition-transform active:scale-95">
                                                    <Plus size={16} className="mr-1.5" /> Create Tag
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTags.map((tag: Tag) => (
                                    <tr key={tag.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors ${selectedIds.has(tag.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="pl-6 pr-4 py-5">
                                            <Button variant="ghost" onClick={() => toggleSelect(tag.id)} className={`w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-500 hover:bg-transparent hover:text-gray-600 ${selectedIds.has(tag.id) ? 'text-primary' : ''}`} aria-label="Select">
                                                {selectedIds.has(tag.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </Button>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-700 dark:text-white">
                                            {tag.name}
                                        </td>
                                        <td className="px-6 py-5 text-gray-600 font-mono text-xs">{tag.slug}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:ring-0 focus-visible:ring-0" aria-label="Open Actions">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#151925] z-[100]">
                                                        <DropdownMenuItem onClick={() => handleEdit(tag)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors outline-none">
                                                            <Edit2 size={14} className="text-gray-500" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                                        <DropdownMenuItem onClick={() => confirmDelete(tag.id)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors outline-none">
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

            {/* Single Delete */}
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

            {/* Bulk Delete */}
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title="Delete Tags"
                description={`Are you sure you want to delete ${selectedIds.size} selected tags? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                isLoading={isBulkLoading}
                onConfirm={handleBulkDelete}
                onCancel={() => setIsBulkConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
