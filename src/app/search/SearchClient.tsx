"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Loader2,
    FileText,
    BookOpen,
    AlertCircle,
    Home,
    ChevronRight,
    Search,
} from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

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
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(query)}`
                );
                const data = await res.json();
                setResults(data.data || []);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 300); // Debounce slightly on initial load
        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div className="min-h-screen bg-[#F7F4EC] dark:bg-transparent text-gray-700 dark:text-gray-300 relative overflow-hidden transition-colors duration-300 flex flex-col">
            {/* Ambient gold radial glow top */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.01] to-transparent pointer-events-none" />

            <PublicHeader />

            <main className="relative z-10 pt-28 pb-20 flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ── Breadcrumb Panel ── */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/60 dark:bg-white/[0.01] border border-amber-900/10 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm backdrop-blur-sm">
                        <Link
                            href="/"
                            className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shrink-0 flex items-center gap-1.5"
                        >
                            <Home size={13} />
                            <span>Home</span>
                        </Link>
                        <ChevronRight
                            size={12}
                            className="text-gray-400 dark:text-gray-600 shrink-0"
                        />
                        <span className="text-gray-800 dark:text-gray-200 font-bold truncate">
                            Search
                        </span>
                    </div>

                    {/* ── Header Section ── */}
                    <div className="mb-12 relative group">
                        <div className="text-left space-y-4">
                            {/* Capsule Category Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Elastic Index Engine</span>
                            </div>

                            {/* Title with icon backdrop */}
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl shadow-sm shrink-0">
                                    <Search
                                        size={22}
                                        className="stroke-[2.5]"
                                    />
                                </div>
                                <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
                                    Universal{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">
                                        Search
                                    </span>
                                </h1>
                            </div>

                            {/* Sophisticated Description */}
                            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
                                A centralized, elastic-powered search engine to
                                instantly query TheNextTrade&apos;s dynamic calculators,
                                professional academy lessons, and core trading
                                insights all in one place.
                            </p>
                        </div>
                    </div>

                    {/* ── Sleek Search Bar ── */}
                    <div className="max-w-xl mb-12">
                        <SearchBar targetRoute="/search" className="w-full" />
                    </div>

                    {/* ── Results Area ── */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2
                                    className="animate-spin text-amber-500"
                                    size={36}
                                />
                            </div>
                        ) : hasSearched && query ? (
                            <>
                                <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                                        Found{" "}
                                        <span className="text-amber-600 dark:text-amber-400 font-black">
                                            {results.length}
                                        </span>{" "}
                                        results for &ldquo;
                                        <span className="text-slate-800 dark:text-white font-extrabold">
                                            {query}
                                        </span>
                                        &rdquo;
                                    </p>
                                </div>

                                {results.length > 0 ? (
                                    <div className="grid gap-4">
                                        {results.map((result) => (
                                            <Link
                                                key={`${result.type}-${result.id}`}
                                                href={result.slug}
                                                className="block bg-white/70 dark:bg-white/[0.02] p-5 rounded-2xl border border-amber-900/10 hover:border-amber-500/30 hover:bg-white/90 dark:hover:bg-[#11100C]/50 hover:shadow-lg transition-all duration-300 group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        className={`p-3 rounded-xl shrink-0 border border-white/5 ${
                                                            result.type ===
                                                            "article"
                                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        }`}
                                                    >
                                                        {result.type ===
                                                        "article" ? (
                                                            <FileText
                                                                size={22}
                                                                className="stroke-[2.2]"
                                                            />
                                                        ) : (
                                                            <BookOpen
                                                                size={22}
                                                                className="stroke-[2.2]"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-1.5 min-w-0">
                                                        <div className="flex items-center gap-2.5">
                                                            <span
                                                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                                    result.type ===
                                                                    "article"
                                                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                                                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                                }`}
                                                            >
                                                                {result.type}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 dark:text-gray-400 font-semibold">
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
                                                        <h3 className="text-base md:text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 font-heading">
                                                            {result.title}
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 line-clamp-2 font-semibold leading-relaxed">
                                                            {result.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight
                                                        size={16}
                                                        className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0 mt-2.5"
                                                    />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-white/70 dark:bg-white/[0.02] rounded-2xl border border-amber-900/10 shadow-sm">
                                        <AlertCircle
                                            className="mx-auto text-amber-500/40 mb-4 animate-bounce"
                                            size={48}
                                        />
                                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white font-heading mb-2">
                                            No results found
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 font-semibold max-w-sm mx-auto">
                                            Try adjusting your search terms or
                                            verify there are no spelling errors.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            !query && (
                                <div className="text-center py-20 bg-white/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-amber-900/15 text-slate-500 dark:text-gray-400 font-semibold text-sm">
                                    Enter a query in the search field above to
                                    start exploring TheNextTrade tools and guides...
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
