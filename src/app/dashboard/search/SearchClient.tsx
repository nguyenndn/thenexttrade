"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, FileText, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SearchResult {
    id: string;
    type: "article" | "lesson";
    title: string;
    slug: string;
    description: string;
    image: string | null;
    date: string;
    meta: any;
}

export default function SearchClient() {
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
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.data || []);
            } catch (error) {
                console.error("Search error", error);
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Search Results</h1>
                <p className="text-gray-500 text-sm mt-1">Found {results.length} results for "{query}"</p>
            </div>

            {/* Results Area */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (hasSearched && query) ? (
                    <>
                        {results.length > 0 ? (
                            <div className="grid gap-3">
                                {results.map((result) => (
                                    <Link
                                        key={`${result.type}-${result.id}`}
                                        href={result.slug}
                                        className="block bg-white dark:bg-[#151925] p-5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary transition-colors group shadow-sm"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl shrink-0 ${result.type === 'article'
                                                ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                                                : 'bg-purple-50 text-purple-500 dark:bg-purple-500/10'
                                                }`}>
                                                {result.type === 'article' ? <FileText size={24} /> : <BookOpen size={24} />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${result.type === 'article'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                        }`}>
                                                        {result.type}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {result.date && formatDistanceToNow(new Date(result.date), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                                    <HighlightText text={result.title} highlight={query || ""} />
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    <HighlightText text={result.description} highlight={query || ""} />
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10">
                                <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                                <p className="text-gray-500">Try adjusting your search terms or check for typos.</p>
                            </div>
                        )}
                    </>
                ) : !query && (
                    <div className="text-center py-20 opacity-50">
                        Type keywords above to start searching...
                    </div>
                )}
            </div>
        </div>
    );
}
