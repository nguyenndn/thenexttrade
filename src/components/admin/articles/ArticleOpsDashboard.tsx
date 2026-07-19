"use client";

import { trackEvent } from "@/lib/track";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
    FileText,
    Image as ImageIcon,
    Search,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    ExternalLink,
    Pencil,
    SearchCheck,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ArticleReadinessBadge } from "./ArticleReadinessBadge";
import { ArticleImagePromptModal } from "./ArticleImagePromptModal";
import { BulkSeoFixModal } from "./BulkSeoFixModal";
import { BulkImagePromptModal } from "./BulkImagePromptModal";
import {
    getArticleOpsDashboard,
    getArticleImagePrompts,
    getArticleSeoFixSuggestion,
    applyArticleSeoFixAction,
} from "@/actions/article-ops";
import { ArticleSeoFixModal } from "./ArticleSeoFixModal";
import { getIssueLabel } from "@/lib/articles/article-readiness.shared";
import type {
    ArticleOpsRow,
    ArticleOpsSummary,
    ArticleOpsFilter,
    ArticleImagePrompts,
} from "@/lib/articles/article-readiness.shared";
import type {
    ArticleSeoFixPayload,
    ArticleSeoFixSuggestion,
} from "@/lib/articles/article-seo-fix.shared";

interface ArticleOpsDashboardProps {
    initialRows: ArticleOpsRow[];
    initialSummary: ArticleOpsSummary;
}

const FILTERS: {
    label: string;
    value: ArticleOpsFilter;
    icon: React.ElementType;
}[] = [
    { label: "All", value: "all", icon: FileText },
    {
        label: "Needs Featured Image",
        value: "needs_featured_image",
        icon: ImageIcon,
    },
    {
        label: "Needs Inline Images",
        value: "needs_inline_images",
        icon: ImageIcon,
    },
    { label: "Needs SEO", value: "needs_seo", icon: Search },
    { label: "Published", value: "published", icon: CheckCircle2 },
    { label: "Draft", value: "draft", icon: Pencil },
];

function SummaryCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4">
            <div className="flex items-center gap-3">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
                >
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums">
                        {value}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ArticleOpsDashboard({
    initialRows,
    initialSummary,
}: ArticleOpsDashboardProps) {
    const [rows, setRows] = useState(initialRows);
    const [summary] = useState(initialSummary);
    const [activeFilter, setActiveFilter] = useState<ArticleOpsFilter>("all");
    const [isPending, startTransition] = useTransition();
    const [promptsData, setPromptsData] = useState<ArticleImagePrompts | null>(
        null
    );
    const [loadingPromptId, setLoadingPromptId] = useState<string | null>(null);
    const [seoSuggestion, setSeoSuggestion] =
        useState<ArticleSeoFixSuggestion | null>(null);
    const [loadingSeoId, setLoadingSeoId] = useState<string | null>(null);
    const [isApplyingSeo, setIsApplyingSeo] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkSeo, setShowBulkSeo] = useState(false);
    const [showBulkImages, setShowBulkImages] = useState(false);

    const openBulkSeo = () => {
        trackEvent("article_ops_bulk_seo_opened", {
            surface: "article_ops",
            action: "open_bulk_seo",
            count: selectedIds.size,
        });
        setShowBulkSeo(true);
    };
    const openBulkImages = () => {
        trackEvent("article_ops_bulk_image_prompts_opened", {
            surface: "article_ops",
            action: "open_bulk_image_prompts",
            count: selectedIds.size,
        });
        setShowBulkImages(true);
    };

    function hasSeoIssues(row: ArticleOpsRow) {
        return row.readiness.issues.some((issue) =>
            [
                "MISSING_META_DESCRIPTION",
                "META_DESCRIPTION_TOO_LONG",
                "MISSING_FOCUS_KEYWORD",
                "MISSING_SCHEMA_TYPE",
            ].includes(issue)
        );
    }

    const handleOpenSeoFix = async (articleId: string) => {
        setLoadingSeoId(articleId);
        try {
            const data = await getArticleSeoFixSuggestion(articleId);
            if (data) setSeoSuggestion(data);
        } catch (err) {
            console.error("Failed to load SEO suggestion:", err);
        } finally {
            setLoadingSeoId(null);
        }
    };

    const handleApplySeoFix = async (payload: ArticleSeoFixPayload) => {
        if (!seoSuggestion) return;
        setIsApplyingSeo(true);
        try {
            await applyArticleSeoFixAction(seoSuggestion.articleId, payload);
            setSeoSuggestion(null);
            const data = await getArticleOpsDashboard(activeFilter);
            setRows(data.rows);
        } catch (err) {
            console.error("Failed to apply SEO fix:", err);
        } finally {
            setIsApplyingSeo(false);
        }
    };

    const handleFilterChange = (filter: ArticleOpsFilter) => {
        setActiveFilter(filter);
        setSelectedIds(new Set()); // Clear selection on filter change
        startTransition(async () => {
            const data = await getArticleOpsDashboard(filter);
            setRows(data.rows);
        });
    };

    const handleOpenPrompts = async (articleId: string) => {
        setLoadingPromptId(articleId);
        try {
            const data = await getArticleImagePrompts(articleId);
            if (data) setPromptsData(data);
        } catch (err) {
            console.error("Failed to load prompts:", err);
        } finally {
            setLoadingPromptId(null);
        }
    };

    return (
        <Tabs
            value={activeFilter}
            onValueChange={(v) => handleFilterChange(v as ArticleOpsFilter)}
            tabsId="article-ops"
        >
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 px-1">
                        All Articles Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <SummaryCard
                            label="Total Articles"
                            value={summary.total}
                            icon={FileText}
                            color="bg-primary/10 text-primary"
                        />
                        <SummaryCard
                            label="Ready"
                            value={summary.ready}
                            icon={CheckCircle2}
                            color="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        />
                        <SummaryCard
                            label="Needs Images"
                            value={summary.needsImages}
                            icon={ImageIcon}
                            color="bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        />
                        <SummaryCard
                            label="Needs SEO"
                            value={summary.needsSeo}
                            icon={Search}
                            color="bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        />
                        <SummaryCard
                            label="Missing Files"
                            value={summary.missingFiles}
                            icon={AlertTriangle}
                            color="bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="shrink-0">
                        {FILTERS.map((f) => (
                            <TabsTrigger
                                key={f.value}
                                value={f.value}
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <f.icon size={15} />
                                <span>{f.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Bulk Toolbar */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {selectedIds.size} selected
                        </span>
                        {rows.some(
                            (r) => selectedIds.has(r.id) && hasSeoIssues(r)
                        ) && (
                            <Button
                                variant="outline"
                                className="text-xs px-3 py-1.5 h-auto"
                                onClick={openBulkSeo}
                            >
                                <SearchCheck size={13} className="mr-1" /> Bulk
                                Fix SEO
                            </Button>
                        )}
                        {rows.some(
                            (r) =>
                                selectedIds.has(r.id) &&
                                r.readiness.issues.some((i) =>
                                    i.includes("IMAGE")
                                )
                        ) && (
                            <Button
                                variant="outline"
                                className="text-xs px-3 py-1.5 h-auto"
                                onClick={openBulkImages}
                            >
                                <ImageIcon size={13} className="mr-1" /> Bulk
                                Image Prompts
                            </Button>
                        )}
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            <X size={14} className="text-gray-500" />
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
                                    <th className="px-3 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={
                                                rows.length > 0 &&
                                                selectedIds.size === rows.length
                                            }
                                            onChange={() => {
                                                if (
                                                    selectedIds.size ===
                                                    rows.length
                                                )
                                                    setSelectedIds(new Set());
                                                else
                                                    setSelectedIds(
                                                        new Set(
                                                            rows.map(
                                                                (r) => r.id
                                                            )
                                                        )
                                                    );
                                            }}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Article
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Issues
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Featured
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Inline
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Updated
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody
                                className={
                                    isPending
                                        ? "opacity-50 pointer-events-none"
                                        : ""
                                }
                            >
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                                        >
                                            <CheckCircle2
                                                size={24}
                                                className="mx-auto mb-2 text-emerald-500"
                                            />
                                            <p className="text-sm font-medium">
                                                All articles look good!
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-gray-50 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(
                                                        row.id
                                                    )}
                                                    onChange={() => {
                                                        setSelectedIds(
                                                            (prev) => {
                                                                const next =
                                                                    new Set(
                                                                        prev
                                                                    );
                                                                if (
                                                                    next.has(
                                                                        row.id
                                                                    )
                                                                )
                                                                    next.delete(
                                                                        row.id
                                                                    );
                                                                else
                                                                    next.add(
                                                                        row.id
                                                                    );
                                                                return next;
                                                            }
                                                        );
                                                    }}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1 max-w-[250px]">
                                                    {row.title}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        row.status ===
                                                        "PUBLISHED"
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                                                            : row.status ===
                                                                "DRAFT"
                                                              ? "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                                                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ArticleReadinessBadge
                                                    score={row.readiness.score}
                                                    issues={
                                                        row.readiness.issues
                                                    }
                                                    compact
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {row.readiness.issues
                                                        .slice(0, 2)
                                                        .map((issue) => (
                                                            <span
                                                                key={issue}
                                                                className="text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded"
                                                            >
                                                                {getIssueLabel(
                                                                    issue
                                                                )}
                                                            </span>
                                                        ))}
                                                    {row.readiness.issues
                                                        .length > 2 && (
                                                        <span className="text-[10px] text-gray-400">
                                                            +
                                                            {row.readiness
                                                                .issues.length -
                                                                2}
                                                        </span>
                                                    )}
                                                    {row.readiness.issues
                                                        .length === 0 && (
                                                        <span className="text-[10px] text-emerald-500">
                                                            None
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {row.readiness
                                                    .featuredImagePath ? (
                                                    row.readiness
                                                        .featuredImageExists ? (
                                                        <CheckCircle2
                                                            size={14}
                                                            className="mx-auto text-emerald-500"
                                                        />
                                                    ) : (
                                                        <AlertTriangle
                                                            size={14}
                                                            className="mx-auto text-red-500"
                                                        />
                                                    )
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
                                                    {
                                                        row.readiness
                                                            .inlineImageCount
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {new Date(
                                                    row.updatedAt
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/articles/${row.id}/edit`}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                        aria-label="Edit article"
                                                    >
                                                        <Pencil size={14} />
                                                    </Link>
                                                    <Link
                                                        href={`/articles/${row.slug}`}
                                                        target="_blank"
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                        aria-label="Preview article"
                                                    >
                                                        <ExternalLink
                                                            size={14}
                                                        />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenPrompts(
                                                                row.id
                                                            )
                                                        }
                                                        disabled={
                                                            loadingPromptId ===
                                                            row.id
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors text-gray-400 hover:text-gold disabled:opacity-50"
                                                        aria-label="Generate image prompts"
                                                    >
                                                        <Sparkles
                                                            size={14}
                                                            className={
                                                                loadingPromptId ===
                                                                row.id
                                                                    ? "animate-pulse"
                                                                    : ""
                                                            }
                                                        />
                                                    </button>
                                                    {hasSeoIssues(row) && (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenSeoFix(
                                                                    row.id
                                                                )
                                                            }
                                                            disabled={
                                                                loadingSeoId ===
                                                                row.id
                                                            }
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                                                            aria-label="Fix SEO"
                                                            title="Fix SEO"
                                                        >
                                                            <SearchCheck
                                                                size={14}
                                                                className={
                                                                    loadingSeoId ===
                                                                    row.id
                                                                        ? "animate-pulse"
                                                                        : ""
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Prompt Modal */}
                {promptsData && (
                    <ArticleImagePromptModal
                        prompts={promptsData}
                        onClose={() => setPromptsData(null)}
                    />
                )}

                {/* SEO Fix Modal */}
                {seoSuggestion && (
                    <ArticleSeoFixModal
                        suggestion={seoSuggestion}
                        isApplying={isApplyingSeo}
                        onApply={handleApplySeoFix}
                        onRegenerate={() =>
                            handleOpenSeoFix(seoSuggestion.articleId)
                        }
                        onClose={() => setSeoSuggestion(null)}
                    />
                )}
                {/* Bulk SEO Fix Modal */}
                {showBulkSeo && (
                    <BulkSeoFixModal
                        articleIds={[...selectedIds]}
                        open={showBulkSeo}
                        onClose={() => setShowBulkSeo(false)}
                        onApplied={() => {
                            setShowBulkSeo(false);
                            setSelectedIds(new Set());
                            handleFilterChange(activeFilter);
                        }}
                    />
                )}

                {/* Bulk Image Prompt Modal */}
                {showBulkImages && (
                    <BulkImagePromptModal
                        articleIds={[...selectedIds]}
                        open={showBulkImages}
                        onClose={() => setShowBulkImages(false)}
                    />
                )}
            </div>
        </Tabs>
    );
}
