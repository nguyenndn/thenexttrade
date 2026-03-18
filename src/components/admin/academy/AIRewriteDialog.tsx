"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Link2, FileText, RefreshCw, Check, X, Eye, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIRewriteDialogProps {
    onApply: (data: { title: string; content: string }) => void;
}

export function AIRewriteDialog({ onApply }: AIRewriteDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [pastedContent, setPastedContent] = useState("");
    const [inputMode, setInputMode] = useState<"url" | "paste">("url");
    const [mode, setMode] = useState<"summary" | "rewrite">("rewrite");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ title: string; content: string } | null>(null);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (inputMode === "url" && !url.trim()) return toast.warning("Please paste a URL");
        if (inputMode === "paste" && !pastedContent.trim()) return toast.warning("Please paste some content");

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: inputMode === "url" ? url.trim() : undefined,
                    pastedContent: inputMode === "paste" ? pastedContent.trim() : undefined,
                    mode,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setResult({ title: data.title, content: data.content });
            toast.success(mode === "summary" ? "Summary generated!" : "Content rewritten!");
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (!result) return;
        onApply(result);
        setIsOpen(false);
        setResult(null);
        setUrl("");
        setPastedContent("");
        toast.success("Content applied to editor!");
    };

    const close = () => {
        if (isLoading) return;
        setIsOpen(false);
        setResult(null);
        setUrl("");
        setPastedContent("");
        setError("");
    };

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
                        className="bg-white dark:bg-[#1a1e2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Content Rewriter</h3>
                                    <p className="text-xs text-gray-500">Paste a URL → AI rewrites with your persona</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={close} disabled={isLoading} className="text-gray-400">
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Input Mode Toggle */}
                            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setInputMode("url")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                                        inputMode === "url"
                                            ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                                            ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <ClipboardPaste size={13} /> Paste Content
                                </button>
                            </div>

                            {/* URL Input */}
                            {inputMode === "url" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                        <Link2 size={12} className="inline mr-1" /> Source URL
                                    </label>
                                    <input
                                        ref={inputRef}
                                        type="url"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && !isLoading) handleGenerate(); }}
                                        placeholder="https://www.babypips.com/learn/forex/what-is-forex"
                                        disabled={isLoading}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
                                    />
                                </div>
                            )}

                            {/* Paste Content */}
                            {inputMode === "paste" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                        <ClipboardPaste size={12} className="inline mr-1" /> Paste Article Content
                                    </label>
                                    <textarea
                                        value={pastedContent}
                                        onChange={e => setPastedContent(e.target.value)}
                                        placeholder="Copy the article content from BabyPips and paste it here..."
                                        disabled={isLoading}
                                        rows={6}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50 resize-y"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Tip: Select all text on the lesson page (Ctrl+A), copy (Ctrl+C), and paste here</p>
                                </div>
                            )}

                            {/* Mode Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMode("summary")}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                                            mode === "summary"
                                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
                                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <FileText size={16} />
                                        Summary
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("rewrite")}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                                            mode === "rewrite"
                                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
                                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <RefreshCw size={16} />
                                        Full Rewrite
                                    </button>
                                </div>
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
                                    <p className="text-sm text-gray-500">
                                        {mode === "summary" ? "Analyzing content..." : "Rewriting with Captain TheNextTrade's voice..."}
                                    </p>
                                    <p className="text-xs text-gray-400">This may take 15-30 seconds</p>
                                </div>
                            )}

                            {/* Result Preview */}
                            {result && !isLoading && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        <Check size={16} /> Generated Successfully
                                    </div>

                                    {/* Title Preview */}
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</span>
                                        <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{result.title}</p>
                                    </div>

                                    {/* Content Preview */}
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 max-h-48 overflow-y-auto">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
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
                        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                            <p className="text-sm text-gray-400">Powered by Gemini 3 Flash + FireCrawl · Captain TheNextTrade</p>
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
                                        disabled={isLoading || (inputMode === "url" ? !url.trim() : !pastedContent.trim())}
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
