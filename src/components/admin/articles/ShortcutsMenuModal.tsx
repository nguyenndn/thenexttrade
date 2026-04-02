"use client";

import { useState, useEffect } from "react";
import { X, Search, Zap, Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PremiumInput } from "@/components/ui/PremiumInput";

interface Shortcut {
    id: string;
    name: string;
    description: string;
    content: string;
    createdAt: string;
}

interface ShortcutsMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (shortcutTag: string, shortcutName: string) => void;
}

export function ShortcutsMenuModal({ isOpen, onClose, onSelect }: ShortcutsMenuModalProps) {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchShortcuts();
        }
    }, [isOpen]);

    const fetchShortcuts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/articles/shortcuts");
            if (res.ok) {
                const data = await res.json();
                setShortcuts(data);
            }
        } catch (error) {
            console.error("Failed to fetch shortcuts", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredShortcuts = shortcuts.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#151925] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col border border-gray-100 dark:border-white/5 max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <Zap size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Shortcuts</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchShortcuts}
                            className="text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                            title="Reload shortcuts"
                            aria-label="Reload shortcuts"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <Link href="/admin/articles/shortcuts" target="_blank" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus size={16} /> Manage
                        </Link>
                        <Button variant="outline" size="icon" onClick={onClose} aria-label="Close modal" className="w-auto h-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl dark:hover:bg-white/5 transition-colors border-0">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                    <PremiumInput
                        icon={Search}
                        placeholder="Search for content snippets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm">Loading snippets...</span>
                        </div>
                    ) : filteredShortcuts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredShortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.id}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(`{{${shortcut.name}}}`, shortcut.name); }}
                                    onClick={() => onSelect(`{{${shortcut.name}}}`, shortcut.name)}
                                    className="flex flex-col items-start p-4 text-left border border-gray-100 dark:border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full mb-1">
                                        <Zap size={14} className="text-yellow-500" />
                                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate w-full transition-colors">{shortcut.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                                        {shortcut.description || "No description provided."}
                                    </p>
                                    <div className="mt-3 text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-gray-400 w-full truncate">
                                        HTML Supported
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 mt-4">
                            <Zap size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No Shortcuts Found</p>
                            <p className="text-sm text-gray-400 mb-4 max-w-sm">Create reusable content snippets to insert instantly into your articles.</p>
                            <Link href="/admin/articles/shortcuts" target="_blank">
                                <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">Create First Shortcut</Button>
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
