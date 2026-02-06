
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
    Edit2, Trash2, Eye, ArrowUpRight, FileText,
    Search, CheckSquare, Square, Loader2,
    ChevronLeft, ChevronRight, CheckCircle, XCircle
} from "lucide-react";
import { ArticleRowActions } from "./ArticleRowActions";

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
    authors: { id: string; name: string }[];
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
                <button
                    onClick={() => onToggle(article.id)}
                    className="text-gray-400 hover:text-[#00C888] transition-colors"
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#00C888]" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </button>
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
                            className="font-medium text-gray-900 dark:text-white hover:text-[#00C888] transition-colors line-clamp-1"
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
                {article.author.name || 'Unknown'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {article.views.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(article.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <ArticleRowActions articleId={article.id} />
            </td>
        </tr>
    );
});

export const ArticleList = memo(function ArticleList({ initialArticles, authors, pagination }: ArticleListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [articles, setArticles] = useState(initialArticles);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkLoading, setIsBulkLoading] = useState(false);

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
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilterStatus = useCallback((status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status) {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    const handleFilterAuthor = useCallback((authorId: string) => {
        const params = new URLSearchParams(searchParams);
        if (authorId) {
            params.set("author", authorId);
        } else {
            params.delete("author");
        }
        params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    // Pagination Handler
    const handlePageChange = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

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
        if (action === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.size} articles?`)) return;

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
            // Optimistic update handled by router.refresh -> initialArticles change -> useEffect
        } catch (error) {
            console.error(error);
            alert("Action failed. Please try again.");
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

            // Optimistic update
            setArticles(articles.map(a => a.id === quickEditId ? { ...a, ...quickEditData } : a));
            setQuickEditId(null);
            router.refresh();
        } catch (err) {
            alert("Failed to update");
        } finally {
            setIsSavingQuickEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Unified Toolbar: Search + Filters + Pagination Info */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-4 flex-col md:flex-row">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00C888] transition-colors"
                            defaultValue={searchParams.get("q")?.toString()}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    {/* Filters */}
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none min-w-[140px]"
                            defaultValue={searchParams.get("status")?.toString()}
                            onChange={e => handleFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="PENDING">Pending</option>
                        </select>
                        <select
                            className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none min-w-[140px]"
                            defaultValue={searchParams.get("author")?.toString()}
                            onChange={e => handleFilterAuthor(e.target.value)}
                        >
                            <option value="">All Authors</option>
                            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions (Visible when selected) */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 bg-[#00C888]/10 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-5 text-sm">
                        <span className="font-bold text-[#00C888] mr-2">{selectedIds.size} selected</span>

                        <button
                            onClick={() => handleBulkAction("updateStatus", "PUBLISHED")}
                            disabled={isBulkLoading}
                            className="p-2 hover:bg-[#00C888]/20 text-[#00C888] rounded-lg transition-colors disabled:opacity-50"
                            title="Set as Published"
                        >
                            {isBulkLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        </button>

                        <button
                            onClick={() => handleBulkAction("updateStatus", "DRAFT")}
                            disabled={isBulkLoading}
                            className="p-2 hover:bg-[#00C888]/20 text-orange-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Set as Draft"
                        >
                            {isBulkLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                        </button>

                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />

                        <button
                            onClick={() => handleBulkAction("delete")}
                            disabled={isBulkLoading}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Selected"
                        >
                            {isBulkLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="px-6 py-5 w-10">
                                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                        {selectedIds.size === articles.length && articles.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                </th>
                                <th className="px-6 py-5">Article</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Author</th>
                                <th className="px-6 py-5">Stats</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {articles.map((article) => (
                                <tr key={article.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors ${selectedIds.has(article.id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-5">
                                        <button onClick={() => toggleSelect(article.id)} className={`text-gray-400 hover:text-gray-600 ${selectedIds.has(article.id) ? 'text-blue-500' : ''}`}>
                                            {selectedIds.has(article.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    </td>

                                    {quickEditId === article.id ? (
                                        <td colSpan={6} className="px-6 py-5 bg-gray-50 dark:bg-white/5">
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
                                                    <select
                                                        className="w-full p-2 rounded border"
                                                        value={quickEditData?.status}
                                                        onChange={e => setQuickEditData(prev => ({ ...prev!, status: e.target.value }))}
                                                    >
                                                        <option value="DRAFT">Draft</option>
                                                        <option value="PUBLISHED">Published</option>
                                                        <option value="PENDING">Pending</option>
                                                        <option value="ARCHIVED">Archived</option>
                                                    </select>
                                                </div>
                                                <div className="flex gap-2 pb-1">
                                                    <button
                                                        onClick={saveQuickEdit}
                                                        disabled={isSavingQuickEdit}
                                                        className="px-3 py-2 bg-[#00C888] text-white rounded hover:bg-[#00a872]"
                                                    >
                                                        {isSavingQuickEdit ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                                                    </button>
                                                    <button
                                                        onClick={() => setQuickEditId(null)}
                                                        className="px-3 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
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
                                                                <FileText size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#00C888] transition-colors">{article.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-400 font-mono">/{article.slug}</span>
                                                            <button
                                                                onClick={() => startQuickEdit(article)}
                                                                className="text-[10px] items-center gap-1 text-blue-500 hidden group-hover:flex"
                                                            >
                                                                <Edit2 size={10} /> Quick Edit
                                                            </button>
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                                                        {(article.author.name?.[0] || "A").toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                                            {article.author.name || "Unknown"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1" title="Views">
                                                    <Eye size={14} />
                                                    <span className="font-semibold">{article.views}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/articles/${article.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-[#00C888] hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors" title="View Article">
                                                        <ArrowUpRight size={18} />
                                                    </Link>
                                                    <Link href={`/admin/articles/${article.id}/edit`} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <ArticleRowActions articleId={article.id} />
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
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                            className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
