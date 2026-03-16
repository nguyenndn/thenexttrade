"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Plus, Edit2, Trash2, Zap, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { toast } from "sonner";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
};
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Shortcut {
    id: string;
    name: string;
    description: string;
    content: string;
    createdAt: string;
}

export default function ShortcutsManagerPage() {
    const { data, error, isLoading, mutate } = useSWR("/api/articles/shortcuts", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Failed to load shortcuts");
        }
    });

    const shortcuts: Shortcut[] = data || [];

    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", content: "" });

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [shortcutToDelete, setShortcutToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);



    const handleOpenModal = (shortcut?: Shortcut) => {
        if (shortcut) {
            setEditingId(shortcut.id);
            setFormData({ name: shortcut.name, description: shortcut.description || "", content: shortcut.content });
        } else {
            setEditingId(null);
            setFormData({ name: "", description: "", content: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: "", description: "", content: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.content.trim()) {
            toast.warning("Name and content are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/articles/shortcuts/${editingId}` : "/api/articles/shortcuts";
            
            // Note: Since we only built POST and DELETE API, we might need a PUT API, 
            // but currently the user just wants the basic block creation. I'll implement POST.
            // If editingId exists, we can delete and recreate or just call PUT (I'll implement PUT next).
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("API Error");

            toast.success(editingId ? "Shortcut updated!" : "Shortcut created!");
            await mutate(); // Revalidate SWR data
            handleCloseModal();
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred preserving the shortcut."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: string) => {
        setShortcutToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!shortcutToDelete) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/articles/shortcuts/${shortcutToDelete}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Shortcut deleted successfully.");
            await mutate();
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to delete shortcut."));
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setShortcutToDelete(null);
        }
    };

    const filteredShortcuts = useMemo(() => {
        return shortcuts.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [shortcuts, searchQuery]);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Content Shortcuts"
                description="Manage reusable content snippets to insert instantly into your articles."
                backHref="/admin/articles"
            >
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all">
                    <Plus size={18} strokeWidth={2.5} /> New Shortcut
                </Button>
            </AdminPageHeader>

            {/* Main Content */}
            <div className="space-y-6">
                
                {/* Search Bar Toolbar Card */}
                <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                    <div className="flex-1 w-full max-w-md">
                        <PremiumInput
                            icon={Search}
                            placeholder="Search shortcuts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Card */}
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm p-6 min-h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex flex-col p-6 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl h-[160px] animate-pulse">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10" />
                                        <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-md w-1/2" />
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-full" />
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-3/4" />
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between">
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-24" />
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredShortcuts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {filteredShortcuts.map((shortcut) => (
                                <div key={shortcut.id} className="group relative flex flex-col p-6 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-yellow-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={shortcut.name}>{shortcut.name}</h3>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <Button
                                                variant="ghost" size="icon" 
                                                onClick={() => handleOpenModal(shortcut)} 
                                                className="w-auto h-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Edit"
                                                aria-label="Edit Shortcut"
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => confirmDelete(shortcut.id)} 
                                                className="w-auto h-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                                aria-label="Delete Shortcut"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px] mt-1">
                                        {shortcut.description || "No description provided."}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-xs text-gray-400 flex items-center justify-between">
                                        <span>HTML Snippet</span>
                                        <span>{new Date(shortcut.createdAt).toLocaleDateString('en-US')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 my-10 max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Zap size={28} className="text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Shortcuts Found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                You haven't created any reusable snippets yet. Create your first shortcut to start saving time while writing articles.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} aria-hidden="true" />
                    <div className="relative z-10 bg-white dark:bg-[#151925] w-full max-w-4xl rounded-xl shadow-xl flex flex-col border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-yellow-500" size={24} />
                                <span>{editingId ? "Edit Shortcut" : "Create New Shortcut"}</span>
                            </h2>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#151925]">
                            <form id="shortcut-form" onSubmit={handleSubmit} className="-mt-4 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1 space-y-5">
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Shortcut Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Promotional Banner"
                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-[#00C888] focus:ring-2 focus:ring-[#00C888]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Description <span className="font-normal text-gray-400">(Optional)</span>
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Brief description..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-[#00C888] focus:ring-2 focus:ring-[#00C888]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none h-24"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 group">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Snippet Content <span className="text-red-500">*</span>
                                        </label>
                                        <div className="-mt-1">
                                            <RichTextEditor
                                                content={formData.content}
                                                onChange={content => setFormData({ ...formData, content })}
                                                className="h-[300px] shadow-sm rounded-xl border border-gray-200 dark:border-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] flex justify-end gap-3 z-20 relative">
                            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" form="shortcut-form" disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    "Save Shortcut"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Shortcut"
                description="Are you sure you want to delete this shortcut? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setShortcutToDelete(null);
                }}
                variant="danger"
            />
        </div>
    );
}
