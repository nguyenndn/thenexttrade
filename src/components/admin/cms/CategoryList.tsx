
"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Edit2, Trash2, Plus, FolderOpen, MoreHorizontal, Search, CheckSquare, Square, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryModal } from "./CategoryModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load categories");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
};

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    _count?: {
        articles: number;
    };
}

export default function CategoryList({ hideHeader }: { hideHeader?: boolean }) {
    const { data: categories = [], isLoading, mutate } = useSWR("/api/categories", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Failed to load categories");
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Single Delete State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // Listen for create event from parent
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail === 'categories') handleCreate();
        };
        window.addEventListener('taxonomy-create', handler);
        return () => window.removeEventListener('taxonomy-create', handler);
    }, []);

    // Filter
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter((c: Category) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const confirmDelete = (id: string) => {
        setCategoryToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/categories/${categoryToDelete}`, { method: "DELETE" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }
            toast.success("Category deleted");
            setIsConfirmOpen(false);
            setCategoryToDelete(null);
            await mutate();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Bulk Selection
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCategories.length && filteredCategories.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCategories.map((c: Category) => c.id)));
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
            const res = await fetch("/api/categories/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (!res.ok) throw new Error("Bulk delete failed");
            toast.success(`Deleted ${selectedIds.size} categories`);
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

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCategory(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4">
            {!hideHeader && (
            <AdminPageHeader
                title="Categories"
                description="Organize content with categories and subcategories."
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
                            placeholder="Search categories..."
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
                                    <Button variant="ghost" onClick={toggleSelectAll} className="w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-transparent" aria-label="Select All">
                                        {selectedIds.size === filteredCategories.length && filteredCategories.length > 0 ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
                                    </Button>
                                </th>
                                <th className="px-6 py-5">Name</th>
                                <th className="px-6 py-5">Slug</th>
                                <th className="px-6 py-5">Articles</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3 text-gray-600">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-600">
                                            <FolderOpen size={40} className="mb-3 opacity-30" />
                                            <p className="font-bold text-gray-900 dark:text-gray-300">No categories found</p>
                                            <p className="text-sm mt-1 mb-4">{searchQuery ? 'Try adjusting your search.' : 'Create your first category to start organizing articles.'}</p>
                                            {!searchQuery && (
                                                <Button onClick={handleCreate} variant="outline" className="text-sm shadow-sm transition-transform active:scale-95">
                                                    <Plus size={16} className="mr-1.5" /> Create Category
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category: Category) => (
                                    <tr key={category.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors ${selectedIds.has(category.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="pl-6 pr-4 py-5">
                                            <Button variant="ghost" onClick={() => toggleSelect(category.id)} className={`w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-400 hover:bg-transparent hover:text-gray-600 ${selectedIds.has(category.id) ? 'text-primary' : ''}`} aria-label="Select">
                                                {selectedIds.has(category.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </Button>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-white">
                                            {category.name}
                                            {category.description && (
                                                <div className="text-xs text-gray-600 font-normal mt-1">{category.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-gray-600 font-mono text-xs">{category.slug}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-xs font-bold">
                                                {category._count?.articles || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:ring-0 focus-visible:ring-0" aria-label="Open Actions">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#151925] z-[100]">
                                                        <DropdownMenuItem onClick={() => handleEdit(category)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors outline-none">
                                                            <Edit2 size={14} className="text-gray-400" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                                        <DropdownMenuItem onClick={() => confirmDelete(category.id)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors outline-none">
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

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => mutate()}
                category={editingCategory}
            />

            {/* Single Delete */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Category"
                description="Are you sure you want to delete this category? All articles inside will be uncategorized. This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Category"}
                onConfirm={handleDelete}
                onCancel={() => {
                    if (!isDeleting) setIsConfirmOpen(false);
                }}
                isLoading={isDeleting}
            />

            {/* Bulk Delete */}
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title="Delete Categories"
                description={`Are you sure you want to delete ${selectedIds.size} selected categories? This action cannot be undone.`}
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
