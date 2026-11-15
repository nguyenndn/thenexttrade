"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2,
    FileText,
    BookOpen,
    AlertCircle,
    Search,
    X,
    Calculator,
    Cpu,
    Target,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

interface SearchResult {
    id: string;
    type: "article" | "lesson" | "tool" | "system" | "strategy";
    title: string;
    slug: string;
    description: string;
    image: string | null;
    date: string;
    meta: Record<string, unknown>;
}

export default function SearchClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [inputValue, setInputValue] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        setInputValue(query);
    }, [query]);

    useEffect(() => {
        const activeTerm = inputValue.trim();
        const fetchResults = async () => {
            if (!activeTerm) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            setIsLoading(true);
            setHasSearched(true);
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(activeTerm)}`
                );
                const data = await res.json();
                setResults(data.data || []);
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 250);
        return () => clearTimeout(timeout);
    }, [inputValue]);

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            router.push(`/dashboard/search?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push("/dashboard/search");
        }
    };

    const handleClear = () => {
        setInputValue("");
        setResults([]);
        setHasSearched(false);
        router.push("/dashboard/search");
    };

    const activeQuery = inputValue.trim();

    // Helper to highlight text
    const HighlightText = ({
        text,
        highlight,
    }: {
        text: string;
        highlight: string;
    }) => {
        if (!highlight || !highlight.trim() || !text) {
            return <span>{text}</span>;
        }
        // Escape special regex chars
        const escapeRegExp = (string: string) =>
            string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span
                            key={i}
                            className="bg-gold/20 dark:bg-gold/30 text-gray-900 dark:text-white px-1 rounded-lg font-medium"
                        >
                            {part}
                        </span>
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
            <PageHeader
                title="Search Results"
                description={
                    activeQuery
                        ? `Found ${results.length} results for "${activeQuery}"`
                        : "Search across Academy lessons, risk calculators, trading systems, playbooks, and articles"
                }
            />

            {/* Interactive Search Bar */}
            <form
                onSubmit={handleFormSubmit}
                className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 shadow-sm"
            >
                <label
                    htmlFor="dashboard-search-query"
                    className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                >
                    Search Platform Index
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 flex items-center rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/15 transition-all px-3.5 py-2">
                        <Search
                            size={18}
                            className="text-gray-400 dark:text-gray-500 shrink-0 mr-2.5"
                        />
                        <input
                            id="dashboard-search-query"
                            type="search"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            aria-describedby="dashboard-search-helper"
                            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none"
                        />
                        {inputValue && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleClear}
                                aria-label="Clear search query"
                                className="h-6 w-6 rounded-lg border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white ml-2 shrink-0 p-0"
                            >
                                <X size={13} />
                            </Button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        className="rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold px-6 py-2.5 h-auto shrink-0"
                    >
                        Search
                    </Button>
                </div>
                <p
                    id="dashboard-search-helper"
                    className="mt-2 text-xs text-gray-500 dark:text-gray-400"
                >
                    Filter across Academy curriculum, Forex calculators, trading systems, playbooks, and research articles.
                </p>
            </form>

            {/* Results Area */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2
                            className="animate-spin text-amber-600 dark:text-gold"
                            size={32}
                        />
                    </div>
                ) : hasSearched && activeQuery ? (
                    <>
                        {results.length > 0 ? (
                            <div className="grid gap-3">
                                {results.map((result) => (
                                    <Link
                                        key={`${result.type}-${result.id}`}
                                        href={result.slug}
                                        className="block bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gold/40 dark:hover:border-gold/40 transition-shadow group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`p-3 rounded-lg border shrink-0 ${
                                                    result.type === "article"
                                                        ? "bg-gold/10 text-amber-600 dark:text-gold border-gold/20"
                                                        : result.type === "tool"
                                                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                                          : result.type === "system" || result.type === "strategy"
                                                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                }`}
                                            >
                                                {result.type === "article" ? (
                                                    <FileText size={24} />
                                                ) : result.type === "tool" ? (
                                                    <Calculator size={24} />
                                                ) : result.type === "system" ? (
                                                    <Cpu size={24} />
                                                ) : result.type === "strategy" ? (
                                                    <Target size={24} />
                                                ) : (
                                                    <BookOpen size={24} />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                                                            result.type ===
                                                            "article"
                                                                ? "bg-gold/10 text-amber-600 dark:text-gold border-gold/20"
                                                                : result.type === "tool"
                                                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                                                  : result.type === "system" || result.type === "strategy"
                                                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        }`}
                                                    >
                                                        {result.type}
                                                    </span>
                                                    <span className="text-xs font-mono tabular-nums text-gray-500 font-medium">
                                                        {result.date &&
                                                            formatDistanceToNow(
                                                                new Date(
                                                                    result.date
                                                                ),
                                                                {
                                                                    addSuffix: true,
                                                                }
                                                            )}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-700 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors line-clamp-1">
                                                    <HighlightText
                                                        text={result.title}
                                                        highlight={activeQuery}
                                                    />
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                    <HighlightText
                                                        text={
                                                            result.description
                                                        }
                                                        highlight={activeQuery}
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10">
                                <AlertCircle
                                    className="mx-auto text-gray-300 mb-4"
                                    size={48}
                                />
                                <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">
                                    No results found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Try adjusting your search terms or check for
                                    typos.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    !activeQuery && (
                        <div className="text-center py-20 opacity-50">
                            Enter keywords in the search bar above to begin.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
