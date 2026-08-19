"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Wand2, Loader2, X, RefreshCw } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TradingViewChart } from "./TradingViewChart";
import { AiResultPanel } from "./AiResultPanel";
import { analyzeChartImage, type ChartAnalysisResult } from "@/actions/chart-analysis";
import { Button } from "@/components/ui/Button";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function AiChartAnalysisLab() {
    const { theme } = useTheme();
    const chartTheme = theme === "light" ? "light" : "dark";

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(
        "Prioritize Price Action + Supply/Demand zones. Max risk 1%."
    );
    const [result, setResult] = useState<ChartAnalysisResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [statusMessage, setStatusMessage] = useState<string>("");

    // Clear custom image
    const handleClearImage = () => {
        setUploadedFile(null);
        setImagePreview(null);
        setResult(null);
    };

    // Primary 1-Click Action: Analyze (Server-side auto capture or custom upload)
    const handleAnalyze = () => {
        setResult(null);
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("theme", chartTheme);
        formData.append("symbol", "OANDA:XAUUSD");
        formData.append("timeframe", "60");

        if (uploadedFile) {
            formData.append("image", uploadedFile);
            setStatusMessage("Analyzing Screenshot...");
        } else {
            setStatusMessage("Capturing & Analyzing...");
        }

        startTransition(async () => {
            const res = await analyzeChartImage(formData);
            setResult(res);
            if (res.ok && res.capturedImagePreview && !uploadedFile) {
                setImagePreview(res.capturedImagePreview);
            }
            setStatusMessage("");
        });
    };

    // Global Paste (Ctrl+V) Handler
    useEffect(() => {
        const handlePaste = (e: globalThis.ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file && ACCEPTED.includes(file.type) && file.size <= MAX_SIZE) {
                        setUploadedFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                    }
                    return;
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, []);

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Chart Area */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#111318]/60 overflow-hidden backdrop-blur-sm">
                <div className="h-[715px] lg:h-[975px]">
                    <TradingViewChart theme={chartTheme} />
                </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#111318]/60 backdrop-blur-sm flex flex-col max-h-[975px]">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                            AI Engine
                        </p>
                        <h2 className="text-base font-black text-gray-800 dark:text-white">
                            Chart Analysis
                        </h2>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10">
                        <Wand2 size={18} className="text-gold" />
                    </div>
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Image Preview (Auto captured or uploaded) */}
                    {imagePreview && (
                        <div className="relative rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                            <img
                                src={imagePreview}
                                alt="Chart analyzed"
                                className="w-full h-auto max-h-[160px] object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleClearImage}
                                disabled={isPending}
                                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                                title="Remove / Reset image"
                                aria-label="Remove image"
                            >
                                <X size={12} />
                            </button>
                            <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur text-[9px] font-medium text-gray-200">
                                {uploadedFile ? "Custom Screenshot" : "Auto Snapshot"}
                            </div>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Analysis Request
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            disabled={isPending}
                            placeholder="E.g., Prioritize Price Action + Supply/Demand zones..."
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3.5 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold resize-none disabled:opacity-50"
                        />
                    </div>

                    {/* Primary 1-Click Action Button */}
                    <div className="space-y-2">
                        <Button
                            variant="primary"
                            onClick={handleAnalyze}
                            disabled={isPending}
                            className="w-full rounded-xl bg-gold px-4 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white whitespace-nowrap overflow-hidden shadow-lg shadow-gold/20 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gold"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin shrink-0" />
                                    <span className="truncate">{statusMessage || "Analyzing..."}</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 size={16} className="shrink-0" />
                                    <span>Analyze Chart</span>
                                </>
                            )}
                        </Button>

                        {uploadedFile && (
                            <button
                                type="button"
                                onClick={handleClearImage}
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2 text-xs font-bold text-gray-400 transition-all hover:text-red-500"
                            >
                                <RefreshCw size={12} />
                                Reset to Auto Chart Snapshot
                            </button>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="border-t border-dashed border-gray-200 dark:border-white/5" />

                    {/* Results */}
                    <AiResultPanel result={result} isLoading={isPending} />
                </div>
            </div>
        </div>
    );
}
