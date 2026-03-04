
"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TagModal } from "./TagModal";
import { toast } from "sonner";

interface Tag {
    id: string;
    name: string;
    slug: string;
}

export default function TagList() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);

    const fetchTags = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/tags");
            const data = await res.json();
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load tags");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/tags/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }

            toast.success("Tag deleted");
            fetchTags();
        } catch (error: any) {
            toast.error(error.message);
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
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Tag Management
                        </h1>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-primary hover:bg-[#00a872] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 py-2.5 h-auto text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Button>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage tags for organizing content.
                </p>
            </div>

            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 rounded-l-xl">Name</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4 rounded-r-xl text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : tags.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No tags found. Create one to get started.</td>
                                </tr>
                            ) : (
                                tags.map((tag) => (
                                    <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            {tag.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tag.slug}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(tag)}
                                                    className="p-2 h-auto w-auto text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(tag.id)}
                                                    className="p-2 h-auto w-auto text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
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
                onSuccess={fetchTags}
                tag={editingTag}
            />
        </div>
    );
}
