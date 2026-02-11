
"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryModal } from "./CategoryModal";
import { toast } from "sonner";

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
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }

            toast.success("Category deleted");
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message);
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
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Category Management
                        </h1>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-primary hover:bg-[#00a872] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 py-2.5 h-auto text-sm font-bold flex items-center gap-2 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Button>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage article categories and structure.
                </p>
            </div>

            <div className="bg-white dark:bg-[#1E2028] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 rounded-l-xl">Name</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Articles</th>
                                <th className="px-6 py-4 rounded-r-xl text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No categories found. Create one to get started.</td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            {category.name}
                                            {category.description && (
                                                <div className="text-xs text-gray-500 font-normal mt-1">{category.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{category.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-xs font-bold">
                                                {category._count?.articles || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
                onSuccess={fetchCategories}
                category={editingCategory}
            />
        </div>
    );
}
