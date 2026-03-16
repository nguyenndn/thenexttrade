
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
    Edit2, Trash2, Eye, ArrowUpRight, FileText,
    Search, CheckSquare, Square, Loader2,
    ChevronLeft, ChevronRight, CheckCircle, XCircle,
    ChevronDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ArticleRowActions } from "./ArticleRowActions";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Article {
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    thumbnail: string | null;
    createdAt: Date;
    author: { name: string | null; image: string | null };
    category: { name: string };
    authorId: string;
}

interface ArticleListProps {
    initialArticles: Article[];

    pagination: {
        currentPage: number;
        totalPages: number;
    };
}

// Memoized Article Row Component
const ArticleRow = memo(function ArticleRow({ 
    article, 
    isSelected, 
    onToggle 
}: { 
    article: Article; 
    isSelected: boolean;
    onToggle: (id: string) => void;
}) {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(article.id)}
                    className="w-auto h-auto p-0 text-gray-400 hover:bg-transparent hover:text-primary transition-colors"
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </Button>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {article.thumbnail ? (
                        <img
                            src={article.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-slate-800"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1"
                        >
                            {article.title}
                        </Link>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {article.category.name}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    article.status === 'PUBLISHED'
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : article.status === 'DRAFT'
                        ? 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                        : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                }`}>
                    {article.status === 'PUBLISHED' && <CheckCircle className="w-3 h-3" />}
                    {article.status === 'DRAFT' && <XCircle className="w-3 h-3" />}
                    {article.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {article.views.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <ArticleRowActions article={{ id: article.id, slug: article.slug }} />
            </td>
        </tr>
    );
});

export const ArticleList = memo(function ArticleList({ initialArticles, pagination }: ArticleListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [articles, setArticles] = useState(initialArticles);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

    // Sync articles when props change (e.g. after server-side search/filter)
    useEffect(() => {
        setArticles(initialArticles);
    }, [initialArticles]);

    // Quick Edit State
    const [quickEditId, setQuickEditId] = useState<string | null>(null);
    const [quickEditData, setQuickEditData] = useState<{ title: string, slug: string, status: string } | null>(null);
    const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);

    // Search & Filter Handlers (URL-based)
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilterStatus = useCallback((status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status) {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams.toString(), router, pathname]);

    // Pagination Handler
    const handlePageChange = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams.toString(), router, pathname]);

    // Bulk Selection
    const toggleSelectAll = () => {
        if (selectedIds.size === articles.length && articles.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(articles.map(a => a.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    // Bulk Actions using API
    const handleBulkAction = async (action: "delete" | "updateStatus", value?: string) => {
        if (action === "delete") {
            setIsBulkConfirmOpen(true);
            return;
        }

        await executeBulkAction(action, value);
    };

    const executeBulkAction = async (action: "delete" | "updateStatus", value?: string) => {
        setIsBulkLoading(true);
        try {
            const res = await fetch("/api/articles/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: Array.from(selectedIds),
                    action,
                    value
                })
            });

            if (!res.ok) throw new Error("Bulk action failed");

            // Refresh data
            router.refresh();
            setSelectedIds(new Set());
            toast.success(`Successfully processed ${selectedIds.size} articles`);
            if (action === "delete") setIsBulkConfirmOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Action failed. Please try again."));
            if (action === "delete") setIsBulkConfirmOpen(false);
        } finally {
            setIsBulkLoading(false);
        }
    };

    // Quick Edit
    const startQuickEdit = (article: Article) => {
        setQuickEditId(article.id);
        setQuickEditData({
            title: article.title,
            slug: article.slug,
            status: article.status
        });
    };

    const saveQuickEdit = async () => {
        if (!quickEditId || !quickEditData) return;
        setIsSavingQuickEdit(true);

        try {
            await fetch(`/api/articles/${quickEditId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(quickEditData)
            });

            setArticles(articles.map(a => a.id === quickEditId ? { ...a, ...quickEditData } : a));
            setQuickEditId(null);
            router.refresh();
            toast.success("Article updated successfully");
        } catch (err: any) {
            toast.error(err instanceof Error ? err.message : (err?.message || "Failed to update article"));
        } finally {
            setIsSavingQuickEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Unified Toolbar: Search + Filters + Pagination Info */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex flex-1 gap-4 flex-col lg:flex-row justify-between w-full lg:items-center">
                    <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full lg:max-w-xl">
                        <div className="flex-1 w-full sm:max-w-md">
                            <PremiumInput
                                icon={Search}
                                placeholder="Search articles..."
                                defaultValue={searchParams.get("q")?.toString()}
                                onChange={e => handleSearch(e.target.value)}
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="md" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center">
                                    <span>Status: <span className="text-primary">{searchParams.get("status") || "All"}</span></span>
                                    <ChevronDown size={14} aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
                                <DropdownMenuItem onClick={() => handleFilterStatus("")}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterStatus("DRAFT")}>Draft</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterStatus("PUBLISHED")}>Published</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterStatus("PENDING")}>Pending</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start lg:justify-end items-center shrink-0">
                        {/* Bulk Actions (Visible when selected) */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 bg-primary/10 px-4 h-[42px] rounded-xl animate-in fade-in zoom-in-95 text-sm shrink-0">
                                <span className="font-bold text-primary mr-2">{selectedIds.size} selected</span>

                                <Button
                                    variant="ghost"
                                    onClick={() => handleBulkAction("updateStatus", "PUBLISHED")}
                                    disabled={isBulkLoading}
                                    className="w-8 h-8 p-0 flex items-center justify-center hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
                                    title="Set as Published"
                                >
                                    {isBulkLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => handleBulkAction("updateStatus", "DRAFT")}
                                    disabled={isBulkLoading}
                                    className="w-8 h-8 p-0 flex items-center justify-center hover:bg-primary/20 text-orange-500 rounded-lg transition-colors disabled:opacity-50"
                                    title="Set as Draft"
                                >
                                    {isBulkLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                </Button>

                                <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />

                                <Button
                                    variant="ghost"
                                    onClick={() => handleBulkAction("delete")}
                                    disabled={isBulkLoading}
                                    className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete Selected"
                                >
                                    {isBulkLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="pl-6 pr-4 py-5 w-14">
                                    <Button variant="ghost" onClick={toggleSelectAll} className="w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-transparent" aria-label="Select All">
                                        {selectedIds.size === articles.length && articles.length > 0 ? <CheckSquare size={20} className="text-primary" aria-hidden="true" /> : <Square size={20} aria-hidden="true" />}
                                    </Button>
                                </th>
                                <th className="px-6 py-5">Article</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Stats</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {articles.map((article) => (
                                <tr key={article.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors ${selectedIds.has(article.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="pl-6 pr-4 py-5 w-14">
                                        <Button variant="ghost" onClick={() => toggleSelect(article.id)} className={`w-5 h-5 min-w-0 min-h-0 p-0 flex items-center justify-center text-gray-400 hover:bg-transparent hover:text-gray-600 ${selectedIds.has(article.id) ? 'text-primary' : ''}`} aria-label="Select Article">
                                            {selectedIds.has(article.id) ? <CheckSquare size={20} aria-hidden="true" /> : <Square size={20} aria-hidden="true" />}
                                        </Button>
                                    </td>

                                    {quickEditId === article.id ? (
                                        <td colSpan={5} className="px-6 py-5 bg-gray-50 dark:bg-white/5">
                                            {/* Quick Edit Form (Same as before) */}
                                            <div className="flex gap-4 items-end animate-in fade-in">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-bold text-gray-500">Title</label>
                                                    <input
                                                        className="w-full p-2 rounded border"
                                                        value={quickEditData?.title}
                                                        onChange={e => setQuickEditData(prev => ({ ...prev!, title: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-bold text-gray-500">Slug</label>
                                                    <input
                                                        className="w-full p-2 rounded border"
                                                        value={quickEditData?.slug}
                                                        onChange={e => setQuickEditData(prev => ({ ...prev!, slug: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="w-40 space-y-2">
                                                    <label className="text-xs font-bold text-gray-500">Status</label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="w-full h-[38px] p-2 rounded justify-between font-normal bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                                                                {quickEditData?.status === "DRAFT" ? "Draft" : quickEditData?.status === "PUBLISHED" ? "Published" : quickEditData?.status === "PENDING" ? "Pending" : "Archived"}
                                                                <ChevronDown size={14} className="opacity-50" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px]">
                                                            <DropdownMenuItem onClick={() => setQuickEditData(prev => ({ ...prev!, status: "DRAFT" }))}>Draft</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setQuickEditData(prev => ({ ...prev!, status: "PUBLISHED" }))}>Published</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setQuickEditData(prev => ({ ...prev!, status: "PENDING" }))}>Pending</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setQuickEditData(prev => ({ ...prev!, status: "ARCHIVED" }))}>Archived</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex gap-2 pb-1">
                                                    <Button
                                                        onClick={saveQuickEdit}
                                                        disabled={isSavingQuickEdit}
                                                        variant="primary"
                                                        size="sm"
                                                    >
                                                        {isSavingQuickEdit ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setQuickEditId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </td>
                                    ) : (
                                        <>
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-10 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden relative flex-shrink-0 border border-gray-200 dark:border-white/5">
                                                        {article.thumbnail ? (
                                                            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center w-full h-full text-gray-400">
                                                                <FileText size={16} aria-hidden="true" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{article.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-400 font-mono">/{article.slug}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => startQuickEdit(article)}
                                                                className="text-[10px] flex items-center gap-1 text-blue-500 opacity-0 pointer-events-none group-hover:opacity-100 focus-within:opacity-100 group-hover:pointer-events-auto focus-within:pointer-events-auto transition-opacity duration-200 h-auto p-0 hover:bg-transparent"
                                                                aria-label="Quick Edit"
                                                            >
                                                                <Edit2 size={10} aria-hidden="true" /> Quick Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {article.category.name}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${article.status === 'PUBLISHED'
                                                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
                                                    : article.status === 'ARCHIVED'
                                                        ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                                                    }`}>
                                                    {article.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1" title="Views">
                                                    <Eye size={14} aria-hidden="true" />
                                                    <span className="font-semibold">{article.views.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end">
                                                    <ArticleRowActions article={{ id: article.id, slug: article.slug }} />
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="text-xs text-gray-500">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                            className="p-2 h-auto w-auto bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="p-2 h-auto w-auto bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bulk Delete Configuration Dialog */}
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title="Delete Articles"
                description={`Are you sure you want to delete ${selectedIds.size} selected articles? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                isLoading={isBulkLoading}
                onConfirm={() => executeBulkAction("delete")}
                onCancel={() => setIsBulkConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
});
