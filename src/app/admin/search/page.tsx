
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { Loader2, FileText, User as UserIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface SearchResult {
    id: string;
    type: "article" | "user" | "lesson";
    title: string;
    slug: string;
    description: string;
    image: string | null;
    date: string;
    meta: any;
}

function AdminSearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            setHasSearched(true);
            try {
                // Fetch with scope=admin
                const res = await fetch(`/api/search?scope=admin&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.data || []);
            } catch {
                // Silently handle search errors
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    // Helper to highlight text
    const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight || !highlight.trim()) {
            return <span>{text}</span>;
        }
        // Escape special regex chars
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <span key={i} className="bg-yellow-300 dark:bg-yellow-600/50 text-gray-900 dark:text-white px-0.5 rounded">{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Admin Search"
                description="Search across Users, Articles (Drafts & Published), and System data."
            />

            {/* Results Area */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (hasSearched && query) ? (
                    <>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 border-b pb-2 border-gray-200 dark:border-white/10">
                            Results for &quot;{query}&quot;
                        </h2>

                        {results.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                                {results.map((result) => (
                                    <Link
                                        key={`${result.type}-${result.id}`}
                                        href={result.slug}
                                        className="flex bg-white dark:bg-[#151925] p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all group shadow-sm"
                                    >
                                        <div className={`p-3 rounded-lg shrink-0 mr-4 h-fit ${result.type === 'article'
                                            ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                                            : result.type === 'user'
                                                ? 'bg-purple-50 text-purple-500 dark:bg-purple-500/10'
                                                : 'bg-gray-50 text-gray-500'
                                            }`}>
                                            {result.type === 'article' ? <FileText size={20} /> : <UserIcon size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${result.type === 'article'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                    }`}>
                                                    {result.type}
                                                </span>
                                                {result.meta?.status && (
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${result.meta.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {result.meta.status}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400 font-medium ml-auto">
                                                    {result.date && formatDistanceToNow(new Date(result.date), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                                                <HighlightText text={result.title} highlight={query || ""} />
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                <HighlightText text={result.description} highlight={query || ""} />
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function AdminSearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <AdminSearchContent />
        </Suspense>
    );
}

