"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Globe, MessageCircle, Twitter, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_LABELS: Record<string, { label: string; icon: string }> = {
    conversational: { label: "Conversational", icon: "💬" },
    mentor: { label: "Mentor", icon: "🧭" },
    storytelling: { label: "Storytelling", icon: "📖" },
    edutainment: { label: "Edutainment", icon: "🎪" },
    professional: { label: "Professional", icon: "👔" },
    analytical: { label: "Analytical", icon: "📊" },
    motivational: { label: "Motivational", icon: "🔥" },
    tactical: { label: "Tactical", icon: "🎯" },
};

interface ContentSourceCardProps {
    rawContent?: string;
    tone?: string;
    sourceUrls?: string[];
    onRewrite?: () => void;
}

export function ContentSourceCard({ rawContent, tone, sourceUrls, onRewrite }: ContentSourceCardProps) {
    const [showRaw, setShowRaw] = useState(false);

    if (!rawContent && !tone && (!sourceUrls || sourceUrls.length === 0)) return null;

    const toneInfo = tone ? TONE_LABELS[tone] : null;

    const getSourceIcon = (url: string) => {
        if (url.includes("reddit.com")) return <MessageCircle size={11} className="text-orange-500" />;
        if (url.includes("x.com") || url.includes("twitter.com")) return <Twitter size={11} className="text-sky-500" />;
        return <Globe size={11} className="text-blue-500" />;
    };

    const getSourceDomain = (url: string) => {
        try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
    };

    return (
        <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-4 space-y-3">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                🤖 AI Source Info
            </label>

            {/* Tone */}
            {toneInfo && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Tone:</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {toneInfo.icon} {toneInfo.label}
                    </span>
                </div>
            )}

            {/* Source URLs */}
            {sourceUrls && sourceUrls.length > 0 && (
                <div className="space-y-1">
                    <span className="text-xs text-gray-400">Sources ({sourceUrls.length}):</span>
                    {sourceUrls.map((url, i) => (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                            {getSourceIcon(url)}
                            {getSourceDomain(url)}
                        </a>
                    ))}
                </div>
            )}

            {/* Raw Content Toggle */}
            {rawContent && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowRaw(!showRaw)}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <FileText size={12} />
                        Raw Content
                        {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {showRaw && (
                        <div className="mt-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 text-[11px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                            {rawContent.substring(0, 3000)}
                            {rawContent.length > 3000 && "\n\n... (truncated)"}
                        </div>
                    )}
                </div>
            )}

            {/* Re-rewrite Button */}
            {rawContent && onRewrite && (
                <button
                    type="button"
                    onClick={onRewrite}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                >
                    <RefreshCw size={12} />
                    Re-rewrite from raw content
                </button>
            )}
        </div>
    );
}
