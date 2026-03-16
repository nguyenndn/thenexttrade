
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Edit2, Trash2, Plus, FolderOpen, MoreHorizontal } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
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

export default function CategoryList() {
    const { data: categories = [], isLoading, mutate } = useSWR("/api/categories", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Failed to load categories");
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
    
    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (id: string) => {
        setCategoryToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/categories/${categoryToDelete}`, {
                method: "DELETE",
            });

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

            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">Name</th>
                                <th className="px-6 py-5">Slug</th>
                                <th className="px-6 py-5">Articles</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3 text-gray-500">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <FolderOpen size={40} className="mb-3 opacity-30" />
                                            <p className="font-bold text-gray-900 dark:text-gray-300">No categories found</p>
                                            <p className="text-sm mt-1 mb-4">Create your first category to start organizing articles.</p>
                                            <Button onClick={handleCreate} variant="outline" className="text-sm shadow-sm transition-transform active:scale-95">
                                                <Plus size={16} className="mr-1.5" /> Create Category
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-white">
                                            {category.name}
                                            {category.description && (
                                                <div className="text-xs text-gray-500 font-normal mt-1">{category.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 font-mono text-xs">{category.slug}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-xs font-bold">
                                                {category._count?.articles || 0}
                                            </span>
                                        </td>
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
                                                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#151925] z-[100]">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleEdit(category)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 focus:bg-gray-50 dark:focus:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors outline-none"
                                                        >
                                                            <Edit2 size={14} className="text-gray-400" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                                        <DropdownMenuItem 
                                                            onClick={() => confirmDelete(category.id)}
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

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => mutate()}
                category={editingCategory}
            />

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
        </div>
    );
}
