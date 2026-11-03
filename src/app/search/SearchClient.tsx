"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    BookOpen,
    AlertCircle,
    Home,
    ChevronRight,
    Search,
    X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { AuthUser } from "@/lib/auth-types";

interface SearchResult {
    id: string;
    type: "article" | "lesson";
    title: string;
    slug: string;
    description: string;
    image: string | null;
    date: string;
    meta?: Record<string, unknown>;
}

interface SearchClientProps {
    user?: AuthUser | null;
}

const SUGGESTED_TOPICS = [
    "Position Sizing",
    "Drawdown Control",
    "Market Structure",
    "Liquidity Sweep",
    "Risk of Ruin",
];

export default function SearchClient({ user }: SearchClientProps) {
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
        const fetchResults = async () => {
            if (!query) {
                setResults([]);
                setHasSearched(false);
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

        const timeout = setTimeout(fetchResults, 250);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push("/search");
        }
    };

    const handleClear = () => {
        setInputValue("");
        setResults([]);
        setHasSearched(false);
        router.push("/search");
    };

    const handleTopicSelect = (topic: string) => {
        setInputValue(topic);
        router.push(`/search?q=${encodeURIComponent(topic)}`);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-gray-300 relative overflow-hidden transition-colors duration-300 flex flex-col">
            {/* Ambient gold radial glow top */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.01] to-transparent pointer-events-none" />

            <PublicHeader user={user} />

            <main className="relative z-10 pt-28 pb-20 flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ── Breadcrumb Panel ── */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm">
                        <Link
                            href="/"
                            className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5"
                        >
                            <Home size={13} className="text-amber-600 dark:text-gold" />
                            <span>Home</span>
                        </Link>
                        <ChevronRight
                            size={12}
                            className="text-gray-400 dark:text-gray-600 shrink-0"
                        />
                        <span className="text-gray-900 dark:text-white font-bold truncate">
                            Search
                        </span>
                    </div>

                    {/* ── Header Section ── */}
                    <div className="mb-10 relative">
                        <div className="text-left space-y-4">
                            {/* Category Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold text-xs font-black uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Knowledge &amp; Curriculum Index</span>
                            </div>

                            {/* Title with icon backdrop */}
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="p-2.5 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg shadow-sm shrink-0">
                                    <Search
                                        size={22}
                                        className="stroke-[2]"
                                    />
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none font-heading">
                                    Universal{" "}
                                    <span className="text-amber-600 dark:text-gold">
                                        Search
                                    </span>
                                </h1>
                            </div>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl font-medium">
                                Query across TheNextTrade&apos;s Academy curriculum, risk management frameworks, and execution research in one place.
                            </p>
                        </div>
                    </div>

                    {/* ── Search Panel (Level 1 Card + Level 2 Recessed Input) ── */}
                    <form
                        onSubmit={handleFormSubmit}
                        className="mb-10 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 shadow-sm"
                    >
                        <label
                            htmlFor="universal-search-query"
                            className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Search Articles &amp; Academy Curriculum
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 flex items-center rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/15 transition-all px-3.5 py-2">
                                <Search
                                    size={18}
                                    className="text-gray-400 dark:text-gray-500 shrink-0 mr-2.5"
                                />
                                <input
                                    id="universal-search-query"
                                    type="search"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    aria-describedby="universal-search-helper"
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
                                Run Search
                            </Button>
                        </div>
                        <p
                            id="universal-search-helper"
                            className="mt-2 text-xs text-gray-500 dark:text-gray-400"
                        >
                            Filter by market structure concept, drawdown rule, risk calculator, or Academy lesson title.
                        </p>
                    </form>

                    {/* ── Results Area ── */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-4" aria-label="Loading search results">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 shadow-sm animate-pulse"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-lg bg-gray-200 dark:bg-white/5 shrink-0" />
                                            <div className="flex-1 space-y-2.5">
                                                <div className="h-4 w-24 rounded-lg bg-gray-200 dark:bg-white/5" />
                                                <div className="h-5 w-2/3 rounded-lg bg-gray-200 dark:bg-white/5" />
                                                <div className="h-4 w-full rounded-lg bg-gray-200 dark:bg-white/5" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hasSearched && query ? (
                            <>
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                                        Found{" "}
                                        <span className="text-amber-600 dark:text-gold font-black font-mono tabular-nums">
                                            {results.length}
                                        </span>{" "}
                                        {results.length === 1 ? "result" : "results"} for &ldquo;
                                        <span className="text-gray-900 dark:text-white font-extrabold">
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
                                                className="block bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gold/40 shadow-sm transition-all duration-200 group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        className={`p-3 rounded-lg shrink-0 border ${
                                                            result.type ===
                                                            "article"
                                                                ? "bg-gold/10 text-amber-600 dark:text-gold border-gold/20"
                                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        }`}
                                                    >
                                                        {result.type ===
                                                        "article" ? (
                                                            <FileText
                                                                size={20}
                                                                className="stroke-[2]"
                                                            />
                                                        ) : (
                                                            <BookOpen
                                                                size={20}
                                                                className="stroke-[2]"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-1.5 min-w-0">
                                                        <div className="flex items-center gap-2.5">
                                                            <span
                                                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                                                                    result.type ===
                                                                    "article"
                                                                        ? "bg-gold/10 text-amber-700 dark:text-gold border-gold/20"
                                                                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                                }`}
                                                            >
                                                                {result.type}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums">
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
                                                        <h3 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors line-clamp-1 font-heading">
                                                            {result.title}
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 font-medium leading-relaxed">
                                                            {result.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight
                                                        size={16}
                                                        className="text-gray-400 group-hover:text-amber-600 dark:group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0 mt-2.5"
                                                    />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-14 px-6 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                        <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle size={22} />
                                        </div>
                                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white font-heading mb-1.5">
                                            No matching articles or lessons found
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto mb-5">
                                            No entries matched &ldquo;{query}&rdquo;. Try broader trading terms such as position sizing, drawdown, or liquidity.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClear}
                                            className="rounded-lg font-bold"
                                        >
                                            Reset Search Filter
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 sm:p-10 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm text-center">
                                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold flex items-center justify-center mx-auto mb-4">
                                    <Search size={22} />
                                </div>
                                <h2 className="text-base font-extrabold text-gray-900 dark:text-white font-heading mb-1.5">
                                    Explore Core Trading Topics
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto mb-6">
                                    Enter a keyword above or select a foundational risk and execution topic below.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {SUGGESTED_TOPICS.map((topic) => (
                                        <Button
                                            key={topic}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTopicSelect(topic)}
                                            className="rounded-lg bg-gray-50/80 dark:bg-[#151925] border-gray-200 dark:border-white/10 hover:border-gold/40 text-xs font-bold text-gray-700 dark:text-gray-200"
                                        >
                                            {topic}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
