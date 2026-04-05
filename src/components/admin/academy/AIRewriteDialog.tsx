"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import {
    Sparkles, Loader2, Link2, RefreshCw, Check, X, Eye, ClipboardPaste,
    Search, Globe, MessageCircle, Twitter, Plus, Trash2, Shield, FileText,
    SearchCode, ExternalLink, Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: "google" | "reddit" | "twitter" | "youtube";
}

interface AIRewriteDialogProps {
    onApply: (data: {
        title: string;
        content: string;
        rawContent?: string;
        tone?: string;
        sourceUrls?: string[];
        metaDescription?: string;
    }) => void;
    lessonTitle?: string;
}

export interface AIRewriteDialogRef {
    openWithContent: (content: string) => void;
}

// ============================================================================
// TONE DATA
// ============================================================================

const TONES = [
    { id: "conversational", label: "Conversational", icon: "💬", desc: "Friendly, casual" },
    { id: "mentor", label: "Mentor", icon: "🧭", desc: "Experience-based" },
    { id: "storytelling", label: "Storytelling", icon: "📖", desc: "Narrative style" },
    { id: "edutainment", label: "Edutainment", icon: "🎪", desc: "Humor + learning" },
    { id: "professional", label: "Professional", icon: "👔", desc: "Formal, data" },
    { id: "analytical", label: "Analytical", icon: "📊", desc: "Compare, analyze" },
    { id: "motivational", label: "Motivational", icon: "🔥", desc: "Inspiring energy" },
    { id: "tactical", label: "Tactical", icon: "🎯", desc: "Step-by-step" },
] as const;

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    google: <Globe size={13} className="text-blue-500" />,
    reddit: <MessageCircle size={13} className="text-orange-500" />,
    twitter: <Twitter size={13} className="text-sky-500" />,
    youtube: <Youtube size={13} className="text-red-500" />,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AIRewriteDialog = forwardRef<AIRewriteDialogRef, AIRewriteDialogProps>(
function AIRewriteDialogInner({ onApply, lessonTitle }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        openWithContent: (content: string) => {
            setPastedContent(content);
            setInputMode("paste");
            setIsOpen(true);
        },
    }));

    // Input
    const [primaryUrl, setPrimaryUrl] = useState("");
    const [pastedContent, setPastedContent] = useState("");
    const [inputMode, setInputMode] = useState<"url" | "paste" | "search">("url");

    // Keyword search
    const [searchKeyword, setSearchKeyword] = useState("");

    // Search
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Options
    const [tone, setTone] = useState("conversational");
    const [mode, setMode] = useState<"summary" | "rewrite">("rewrite");

    // Generation
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        title: string;
        content: string;
        rawContent?: string;
        tone?: string;
        sourceUrls?: string[];
        metaDescription?: string;
    } | null>(null);
    const [error, setError] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);

    const keywordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (inputMode === "search") {
                setTimeout(() => keywordRef.current?.focus(), 150);
            } else {
                setTimeout(() => inputRef.current?.focus(), 150);
            }
        }
    }, [isOpen, inputMode]);

    // Auto-populate keyword from lesson title when switching to search mode
    useEffect(() => {
        if (inputMode === "search" && lessonTitle && !searchKeyword) {
            // Extract clean keyword from lesson title (remove hooks after "—" or "–")
            const keyword = lessonTitle
                .split(/\s*[—–]\s*/)[0] // Take part before em dash
                .replace(/[?!.]/g, "") // Remove punctuation
                .trim();
            setSearchKeyword(keyword);
            setTimeout(() => keywordRef.current?.focus(), 150);
        }
    }, [inputMode, lessonTitle, searchKeyword]);

    // ========================================================================
    // SEARCH HANDLER
    // ========================================================================

    const handleSearch = async () => {
        if (inputMode === "url" && !primaryUrl.trim()) return toast.warning("Please enter a URL first");
        if (inputMode === "search" && !searchKeyword.trim()) return toast.warning("Please enter a keyword");

        setIsSearching(true);
        setSearchResults([]);
        setSelectedUrls(new Set());
        setHasSearched(false);

        try {
            let topic: string;

            if (inputMode === "search") {
                // Keyword mode: use keyword directly
                topic = searchKeyword.trim();
            } else {
                // URL mode: extract topic from URL path
                const urlPath = new URL(primaryUrl.trim()).pathname;
                topic = urlPath
                    .split("/").filter(Boolean).pop()
                    ?.replace(/-/g, " ").replace(/_/g, " ")
                    || "forex trading";
            }

            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    primaryUrl: inputMode === "url" ? primaryUrl.trim() : undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Search failed");

            setSearchResults(data.results || []);
            setHasSearched(true);

            if (data.results?.length > 0) {
                toast.success(`Found ${data.results.length} related sources`);
            } else {
                toast.info("No sources found. Try different keywords.");
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const maxSearchSources = inputMode === "search" ? 4 : 3;

    const toggleSearchResult = (url: string) => {
        setSelectedUrls(prev => {
            const next = new Set(prev);
            if (next.has(url)) {
                next.delete(url);
            } else if (next.size < maxSearchSources) {
                next.add(url);
            } else {
                toast.warning(`Maximum ${maxSearchSources} sources`);
            }
            return next;
        });
    };

    // ========================================================================
    // GENERATE HANDLER
    // ========================================================================

    const handleGenerate = async () => {
        if (inputMode === "url" && !primaryUrl.trim()) return toast.warning("Please paste a URL");
        if (inputMode === "paste" && !pastedContent.trim()) return toast.warning("Please paste some content");
        if (inputMode === "search" && selectedUrls.size === 0) return toast.warning("Please search and select at least 1 source");

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            // Build URL list based on mode
            let urls: string[] = [];
            if (inputMode === "url") {
                urls = [primaryUrl.trim(), ...Array.from(selectedUrls)];
            } else if (inputMode === "search") {
                urls = Array.from(selectedUrls);
            }

            // Build snippets map for fallback (search mode)
            const snippetsMap: Record<string, string> | undefined =
                inputMode === "search"
                    ? Object.fromEntries(
                        searchResults
                            .filter(r => selectedUrls.has(r.url) && r.snippet)
                            .map(r => [r.url, `${r.title}\n\n${r.snippet}`])
                    )
                    : undefined;

            const res = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls: urls.length > 0 ? urls : undefined,
                    pastedContent: inputMode === "paste" ? pastedContent.trim() : undefined,
                    mode,
                    tone,
                    snippets: snippetsMap,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setResult({
                title: data.title,
                content: data.content,
                rawContent: data.rawContent,
                tone: data.tone,
                sourceUrls: data.sourceUrls,
                metaDescription: data.metaDescription,
            });

            const sourceCount = data.sourcesUsed || 1;
            toast.success(
                mode === "summary"
                    ? "Summary generated!"
                    : `Content rewritten from ${sourceCount} source${sourceCount > 1 ? 's' : ''}!`
            );
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // APPLY & CLOSE
    // ========================================================================

    const handleApply = () => {
        if (!result) return;
        onApply(result);
        close();
        toast.success("Content applied to editor!");
    };

    const close = () => {
        if (isLoading) return;
        setIsOpen(false);
        setResult(null);
        setPrimaryUrl("");
        setPastedContent("");
        setSearchKeyword("");
        setSearchResults([]);
        setSelectedUrls(new Set());
        setHasSearched(false);
        setError("");
    };

    // ========================================================================
    // COMPUTED
    // ========================================================================

    const totalSources = inputMode === "url" ? 1 + selectedUrls.size : inputMode === "search" ? selectedUrls.size : 1;
    const copyrightScore = Math.min(5, totalSources >= 3 ? 5 : totalSources >= 2 ? 4 : totalSources >= 1 ? 3 : 0);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <>
            {/* Trigger Button */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 shadow-sm"
            >
                <Sparkles size={18} />
                AI Rewrite
            </Button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={close}>
                    <div
                        className="bg-white dark:bg-[#1a1e2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 max-h-[95vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">AI Content Rewriter</h3>
                                    <p className="text-xs text-gray-600">Multi-source rewrite with copyright protection</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={close} disabled={isLoading} className="text-gray-500">
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Input Mode Toggle */}
                            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setInputMode("url")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                                        inputMode === "url"
                                            ? "bg-white dark:bg-white/10 text-gray-700 dark:text-white shadow-sm"
                                            : "text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <Link2 size={13} /> From URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode("paste")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                                        inputMode === "paste"
                                            ? "bg-white dark:bg-white/10 text-gray-700 dark:text-white shadow-sm"
                                            : "text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <ClipboardPaste size={13} /> Paste Content
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode("search")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                                        inputMode === "search"
                                            ? "bg-white dark:bg-white/10 text-gray-700 dark:text-white shadow-sm"
                                            : "text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <SearchCode size={13} /> Search Topic
                                </button>
                            </div>

                            {/* URL Input + Search */}
                            {inputMode === "url" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                            <Link2 size={12} className="inline mr-1" /> Primary Source URL
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                ref={inputRef}
                                                type="url"
                                                value={primaryUrl}
                                                onChange={e => setPrimaryUrl(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                                                placeholder="https://www.babypips.com/learn/forex/what-is-forex"
                                                disabled={isLoading}
                                                className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSearch}
                                                disabled={isSearching || !primaryUrl.trim() || isLoading}
                                                className="px-4 gap-1.5 shrink-0"
                                            >
                                                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                                Find More
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    {isSearching && (
                                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
                                            <Loader2 size={14} className="animate-spin" />
                                            Searching Google, Reddit & X...
                                        </div>
                                    )}

                                    {hasSearched && searchResults.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                                <Search size={12} className="inline mr-1" /> Supplementary Sources
                                                <span className="text-gray-500 normal-case font-normal ml-1">(select up to 3)</span>
                                            </label>
                                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                                {searchResults.map((r) => (
                                                    <button
                                                        key={r.url}
                                                        type="button"
                                                        onClick={() => toggleSearchResult(r.url)}
                                                        className={cn(
                                                            "w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5",
                                                            selectedUrls.has(r.url)
                                                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 ring-1 ring-amber-200 dark:ring-amber-800"
                                                                : "bg-gray-50 dark:bg-white/5 border-gray-150 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all",
                                                            selectedUrls.has(r.url)
                                                                ? "bg-amber-500 border-amber-500"
                                                                : "border-gray-300 dark:border-gray-600"
                                                        )}>
                                                            {selectedUrls.has(r.url) && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                {SOURCE_ICONS[r.source]}
                                                                <span className="text-xs font-medium text-gray-700 dark:text-white truncate">
                                                                    {r.title}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.url}</p>
                                                        </div>
                                                        <a
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                            title="Preview in new tab"
                                                        >
                                                            <ExternalLink size={12} className="text-gray-400" />
                                                        </a>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {hasSearched && searchResults.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-2">No additional sources found. You can still generate with the primary URL.</p>
                                    )}
                                </>
                            )}

                            {/* Paste Content */}
                            {inputMode === "paste" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                        <ClipboardPaste size={12} className="inline mr-1" /> Paste Article Content
                                    </label>
                                    <textarea
                                        value={pastedContent}
                                        onChange={e => setPastedContent(e.target.value)}
                                        placeholder="Copy the article content from BabyPips and paste it here..."
                                        disabled={isLoading}
                                        rows={5}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50 resize-y"
                                    />
                                </div>
                            )}

                            {/* Search Topic */}
                            {inputMode === "search" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                            <SearchCode size={12} className="inline mr-1" /> Search Topic
                                            {lessonTitle && (
                                                <span className="text-gray-500 normal-case font-normal ml-1">(from lesson title)</span>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                ref={keywordRef}
                                                type="text"
                                                value={searchKeyword}
                                                onChange={e => setSearchKeyword(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                                                placeholder="e.g. What is a Pip, Fibonacci Retracement, Risk Management"
                                                disabled={isLoading}
                                                className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSearch}
                                                disabled={isSearching || !searchKeyword.trim() || isLoading}
                                                className="px-4 gap-1.5 shrink-0"
                                            >
                                                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                                Search
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1.5">💡 Tip: Use forex-specific keywords for better results. Select 2-4 sources for best copyright protection.</p>
                                    </div>

                                    {/* Search Loading */}
                                    {isSearching && (
                                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
                                            <Loader2 size={14} className="animate-spin" />
                                            Searching Google, Reddit & X for "{searchKeyword}"...
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {hasSearched && searchResults.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                                <Search size={12} className="inline mr-1" /> Select Sources to Merge
                                                <span className="text-gray-500 normal-case font-normal ml-1">(pick 1-4, more = better protection)</span>
                                            </label>
                                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                                {searchResults.map((r) => (
                                                    <button
                                                        key={r.url}
                                                        type="button"
                                                        onClick={() => toggleSearchResult(r.url)}
                                                        className={cn(
                                                            "w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5",
                                                            selectedUrls.has(r.url)
                                                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 ring-1 ring-amber-200 dark:ring-amber-800"
                                                                : "bg-gray-50 dark:bg-white/5 border-gray-150 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all",
                                                            selectedUrls.has(r.url)
                                                                ? "bg-amber-500 border-amber-500"
                                                                : "border-gray-300 dark:border-gray-600"
                                                        )}>
                                                            {selectedUrls.has(r.url) && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                {SOURCE_ICONS[r.source]}
                                                                <span className="text-xs font-medium text-gray-700 dark:text-white truncate">
                                                                    {r.title}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.url}</p>
                                                            {r.snippet && (
                                                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{r.snippet}</p>
                                                            )}
                                                        </div>
                                                        <a
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                            title="Preview in new tab"
                                                        >
                                                            <ExternalLink size={12} className="text-gray-400" />
                                                        </a>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {hasSearched && searchResults.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-2">No sources found. Try different keywords.</p>
                                    )}
                                </>
                            )}

                            {/* Tone Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                                    🎨 Tone
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {TONES.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTone(t.id)}
                                            disabled={isLoading}
                                            className={cn(
                                                "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium transition-all border",
                                                tone === t.id
                                                    ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
                                                    : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-base">{t.icon}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mode Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMode("summary")}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                                            mode === "summary"
                                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
                                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <FileText size={15} />
                                        Summary
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("rewrite")}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                                            mode === "rewrite"
                                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
                                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <RefreshCw size={15} />
                                        Full Rewrite
                                    </button>
                                </div>
                            </div>

                            {/* Copyright Status */}
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
                                copyrightScore >= 5
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            )}>
                                <Shield size={14} />
                                <span>Copyright Protection: {copyrightScore}/5 layers</span>
                                {totalSources >= 2 && <span className="text-emerald-500">• {totalSources} sources → merge enabled ✅</span>}
                                {totalSources < 2 && inputMode === "url" && (
                                    <span className="text-amber-500">• Add more sources for stronger protection</span>
                                )}
                                {inputMode === "search" && totalSources === 0 && (
                                    <span className="text-amber-500">• Search and select sources above</span>
                                )}
                                {inputMode === "search" && totalSources === 1 && (
                                    <span className="text-amber-500">• Select more sources for stronger protection</span>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Loading */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full animate-spin border-4 border-amber-200 dark:border-amber-800 border-t-amber-500" />
                                        <Sparkles size={16} className="absolute inset-0 m-auto text-amber-500" />
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {mode === "summary" ? "Analyzing content..." : `Rewriting from ${totalSources} source${totalSources > 1 ? 's' : ''}...`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {totalSources > 1 ? "Scraping + merging + rewriting... this may take 30-60 seconds" : "This may take 15-30 seconds"}
                                    </p>
                                </div>
                            )}

                            {/* Result Preview */}
                            {result && !isLoading && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        <Check size={16} /> Generated Successfully
                                        {result.tone && (
                                            <span className="text-xs font-normal text-gray-500">• Tone: {result.tone}</span>
                                        )}
                                        {(result.sourceUrls?.length || 0) > 1 && (
                                            <span className="text-xs font-normal text-gray-500">• {result.sourceUrls!.length} sources merged</span>
                                        )}
                                    </div>

                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title</span>
                                        <p className="text-base font-bold text-gray-700 dark:text-white mt-1">{result.title}</p>
                                    </div>

                                    {result.metaDescription && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">🔍 Meta Description ({result.metaDescription.length} chars)</span>
                                            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">{result.metaDescription}</p>
                                        </div>
                                    )}

                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 max-h-48 overflow-y-auto">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                            <Eye size={10} /> Content Preview
                                        </span>
                                        <div
                                            className="mt-2 text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: result.content.substring(0, 2000) }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                            <p className="text-[11px] text-gray-500">
                                Gemini + FireCrawl + Serper · {TONES.find(t => t.id === tone)?.icon} {TONES.find(t => t.id === tone)?.label}
                            </p>
                            <div className="flex gap-2">
                                {result && !isLoading && (
                                    <Button
                                        variant="outline"
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="gap-1 text-sm"
                                    >
                                        <RefreshCw size={14} /> Regenerate
                                    </Button>
                                )}

                                {!result ? (
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isLoading || (inputMode === "url" ? !primaryUrl.trim() : inputMode === "paste" ? !pastedContent.trim() : selectedUrls.size === 0)}
                                        className="gap-2 shadow-lg shadow-primary/30"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        Generate
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleApply}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                                    >
                                        <Check size={16} /> Apply
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
);
