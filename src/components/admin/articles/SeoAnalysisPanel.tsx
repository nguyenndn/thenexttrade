"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Smartphone,
    Monitor,
    Facebook,
    Twitter,
    Wand2,
    Lock,
    Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SeoProps {
    focusKeyword: string;
    setFocusKeyword: (val: string) => void;
    title: string;
    slug: string;
    metaDescription: string;
    content: string; // HTML content
    thumbnail?: string;
    onAiGenerate?: (field: "title" | "description") => void;
    autoKeyphrase?: boolean;
    onAutoKeyphraseChange?: (auto: boolean) => void;
}

function extractKeyphrase(title: string): string {
    if (!title) return "";
    const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "shall",
        "can",
        "to",
        "of",
        "in",
        "for",
        "on",
        "with",
        "at",
        "by",
        "from",
        "as",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "between",
        "out",
        "off",
        "over",
        "under",
        "again",
        "further",
        "then",
        "once",
        "here",
        "there",
        "when",
        "where",
        "why",
        "how",
        "all",
        "each",
        "every",
        "both",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "just",
        "because",
        "about",
        "up",
        "down",
        "it",
        "its",
        "this",
        "that",
        "these",
        "those",
        "what",
        "which",
        "who",
        "whom",
        "i",
        "you",
        "he",
        "she",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "my",
        "your",
        "his",
        "our",
        "their",
        "your",
        "nobody",
        "explained",
        "properly",
        "actually",
        "really",
        "simply",
        "basically",
    ]);
    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
    return words.slice(0, 3).join(" ");
}

export function SeoAnalysisPanel({
    focusKeyword,
    setFocusKeyword,
    title,
    slug,
    metaDescription,
    content,
    thumbnail,
    onAiGenerate,
    autoKeyphrase = false,
    onAutoKeyphraseChange,
}: SeoProps) {
    const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
        "mobile"
    );
    const [activeTab, setActiveTab] = useState<
        "seo" | "readability" | "social" | "aiSeo"
    >("seo");
    const [socialPlatform, setSocialPlatform] = useState<
        "facebook" | "twitter"
    >("facebook");

    const [seoAnalysis, setSeoAnalysis] = useState<
        { label: string; status: "good" | "bad" | "warning" }[]
    >([]);
    const [readabilityAnalysis, setReadabilityAnalysis] = useState<
        { label: string; status: "good" | "bad" | "warning" }[]
    >([]);
    const [aiSeoAnalysis, setAiSeoAnalysis] = useState<
        { label: string; status: "good" | "bad" | "warning" }[]
    >([]);

    // Auto-keyphrase: extract from title when auto mode is ON
    useEffect(() => {
        if (!autoKeyphrase) return;
        const keyphrase = extractKeyphrase(title);
        if (keyphrase && keyphrase !== focusKeyword) {
            setFocusKeyword(keyphrase);
        }
    }, [title, autoKeyphrase]);

    // --- SEO Analysis Logic ---
    useEffect(() => {
        if (!focusKeyword && activeTab === "seo") {
            setSeoAnalysis([]);
            return;
        }

        const keyword = focusKeyword ? focusKeyword.toLowerCase() : "";
        const checks: { label: string; status: "good" | "bad" | "warning" }[] =
            [];

        if (keyword) {
            // 1. Keyword in Title
            if (title.toLowerCase().includes(keyword)) {
                checks.push({
                    label: "Focus keyphrase in SEO title",
                    status: "good",
                });
            } else {
                checks.push({
                    label: "Focus keyphrase not in SEO title",
                    status: "bad",
                });
            }

            // 2. Keyword in Slug
            if (slug.toLowerCase().includes(keyword.replace(/\s+/g, "-"))) {
                checks.push({ label: "Keyphrase in slug", status: "good" });
            } else {
                checks.push({
                    label: "Keyphrase not in slug",
                    status: "warning",
                });
            }

            // 3. Keyword in Meta Description
            if (metaDescription.toLowerCase().includes(keyword)) {
                checks.push({
                    label: "Keyphrase in meta description",
                    status: "good",
                });
            } else if (metaDescription.length === 0) {
                checks.push({
                    label: "Meta description not specified",
                    status: "bad",
                });
            } else {
                checks.push({
                    label: "Keyphrase not in meta description",
                    status: "warning",
                });
            }
        } else {
            checks.push({
                label: "Please set a focus keyphrase to see SEO analysis.",
                status: "warning",
            });
        }

        // 4. Content Length
        const textContent = content.replace(/<[^>]*>?/gm, "");
        const wordCount = textContent.split(/\s+/).length;

        if (wordCount > 300) {
            checks.push({ label: "Text length: Good job!", status: "good" });
        } else {
            checks.push({
                label: `Text length: ${wordCount} words (recommended: 300+)`,
                status: "warning",
            });
        }

        setSeoAnalysis(checks);
    }, [focusKeyword, title, slug, metaDescription, content, activeTab]);

    // --- Readability Analysis Logic (PRO) ---
    useEffect(() => {
        const textContent = content.replace(/<[^>]*>?/gm, "");
        const sentences = textContent
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0);
        const words = textContent.split(/\s+/).filter((w) => w.length > 0);
        const syllables = words.reduce(
            (acc, word) => acc + (word.match(/[aeiouy]{1,2}/g)?.length || 1),
            0
        );

        const checks: { label: string; status: "good" | "bad" | "warning" }[] =
            [];

        // 1. Flesch Reading Ease
        // Formula: 206.835 - 1.015(total words / total sentences) - 84.6(total syllables / total words)
        const totalSentences = sentences.length || 1;
        const totalWords = words.length || 1;
        const avgSentenceLength = totalWords / totalSentences;
        const avgSyllablesPerWord = syllables / totalWords;

        const fleschScore =
            206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

        if (fleschScore >= 60) {
            checks.push({
                label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Easy to read)`,
                status: "good",
            });
        } else if (fleschScore >= 30) {
            checks.push({
                label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Moderately difficult)`,
                status: "warning",
            });
        } else {
            checks.push({
                label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Very difficult)`,
                status: "bad",
            });
        }

        // 2. Sentence Length
        const longSentences = sentences.filter(
            (s) => s.split(/\s+/).length > 20
        ).length;
        const longSentenceRatio = (longSentences / totalSentences) * 100;

        if (longSentenceRatio < 25) {
            checks.push({ label: `Sentence length: Great!`, status: "good" });
        } else {
            checks.push({
                label: `Sentence length: ${longSentenceRatio.toFixed(1)}% of sentences contain more than 20 words (try to shorten).`,
                status: "warning",
            });
        }

        // 3. Passive Voice (Basic Regex Detection)
        // Matches: is/are/was/were/be/been/being + past participle (ed) - VERY basic approximation
        const passiveMatches = textContent.match(
            /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi
        );
        const passiveCount = passiveMatches ? passiveMatches.length : 0;
        const passiveRatio = (passiveCount / totalSentences) * 100; // Rough ratio

        if (passiveRatio < 10) {
            checks.push({
                label: "Passive voice: Good amount.",
                status: "good",
            });
        } else {
            checks.push({
                label: `Passive voice: Found ${passiveCount} instances (try to use active voice).`,
                status: "warning",
            });
        }

        setReadabilityAnalysis(checks);
    }, [content, activeTab]);

    // --- AI-SEO / AEO / GEO Analysis Logic ---
    useEffect(() => {
        const textContent = content
            ? content.replace(/<[^>]*>?/gm, "").trim()
            : "";
        const checks: { label: string; status: "good" | "bad" | "warning" }[] =
            [];

        // 1. Direct Answer Block (Optimal word count: 40-60 words in first paragraph)
        const paragraphs = content
            ? content
                  .split(/<\/p>/i)
                  .map((p) => p.replace(/<[^>]*>?/gm, "").trim())
                  .filter((p) => p.length > 10)
            : [];
        const firstPara = paragraphs[0] || "";
        const firstParaWords = firstPara.split(/\s+/).filter(Boolean).length;

        if (firstParaWords >= 40 && firstParaWords <= 65) {
            checks.push({
                label: `Direct Answer Block: Good! First paragraph has ${firstParaWords} words (optimal: 40-60 words for snippet extraction).`,
                status: "good",
            });
        } else if (firstParaWords > 0 && firstParaWords < 40) {
            checks.push({
                label: `Direct Answer Block: First paragraph has only ${firstParaWords} words. Consider expanding to 40-60 words to capture AI Overview placements.`,
                status: "warning",
            });
        } else if (firstParaWords > 65) {
            checks.push({
                label: `Direct Answer Block: First paragraph has ${firstParaWords} words. Consider shortening to 40-60 words for a more concise lead-in sentence.`,
                status: "warning",
            });
        } else {
            checks.push({
                label: "Direct Answer Block: No content paragraph detected. Add a clear introduction paragraph at the start.",
                status: "bad",
            });
        }

        // 2. FAQ Structure (H2 "FAQ" and H3 questions)
        const hasFaqH2 = content
            ? /<h2[^>]*>(?:[^<]*\s+)?FAQ(?:[^<]*)<\/h2>/i.test(content)
            : false;
        if (hasFaqH2) {
            const faqIndex = content.search(
                /<h2[^>]*>(?:[^<]*\s+)?FAQ(?:[^<]*)<\/h2>/i
            );
            const faqContent = content.substring(faqIndex);
            const h3Count = (faqContent.match(/<h3[^>]*>/gi) || []).length;
            if (h3Count >= 2) {
                checks.push({
                    label: `FAQ Structure: Excellent! Detected "FAQ" heading with ${h3Count} questions. This automatically generates a FAQPage JSON-LD Schema.`,
                    status: "good",
                });
            } else {
                checks.push({
                    label: `FAQ Structure: Found "FAQ" heading but only ${h3Count} question(s) (recommended: 2+). Add more questions to build a rich Q&A section.`,
                    status: "warning",
                });
            }
        } else {
            checks.push({
                label: 'FAQ Structure: No "FAQ" H2 heading found. Add an "FAQ" section at the bottom using H3 headings for questions to trigger automatic FAQPage Schema.',
                status: "warning",
            });
        }

        // 3. Outbound Citations (credibility signals)
        const hasOutboundLink = content
            ? /<a[^+]+href=["'](https?:\/\/(?!thenexttrade\.com|localhost|example\.com)[^"']+)["'][^>]*>/i.test(
                  content
              )
            : false;
        if (hasOutboundLink) {
            checks.push({
                label: "Outbound Citations: External citations detected. Linking to authoritative sources builds high trust for GEO algorithms.",
                status: "good",
            });
        } else {
            checks.push({
                label: "Outbound Citations: No external links detected. Consider linking to verified external sources to boost LLM citation probability.",
                status: "warning",
            });
        }

        // 4. Data Density (Numerical stats)
        const numbers = textContent.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
        const uniqueNumbers = new Set(numbers);
        if (uniqueNumbers.size >= 3) {
            checks.push({
                label: `Data Density: Good! Found ${uniqueNumbers.size} distinct numerical statistics/metrics. AI engines highly favor data-rich content.`,
                status: "good",
            });
        } else {
            checks.push({
                label: `Data Density: Only ${uniqueNumbers.size} numerical statistic(s) found. Try adding concrete backtest data, percentages, or metrics to increase GEO citations.`,
                status: "warning",
            });
        }

        // 5. Heading Structure
        const h2Count = content
            ? (content.match(/<h2[^>]*>/gi) || []).length
            : 0;
        if (h2Count >= 3) {
            checks.push({
                label: `Heading Structure: Detected ${h2Count} H2 headings, creating clear semantic sections optimal for AI step extraction.`,
                status: "good",
            });
        } else {
            checks.push({
                label: `Heading Structure: Only ${h2Count} H2 heading(s) found (recommended: 3+). Break content into clear sub-sections to help AI parse key concepts.`,
                status: "warning",
            });
        }

        setAiSeoAnalysis(checks);
    }, [content]);

    return (
        <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                    <Search size={20} className="text-primary" />
                    Yoast SEO (Pro)
                </h3>
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("seo")}
                        className={`px-3.5 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${activeTab === "seo" ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                        SEO
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("readability")}
                        className={`px-3.5 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${activeTab === "readability" ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                        Readability
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("aiSeo")}
                        className={`px-3.5 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${activeTab === "aiSeo" ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                        AI-SEO
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("social")}
                        className={`px-3.5 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${activeTab === "social" ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                        Social
                    </Button>
                </div>
            </div>

            {/* --- SEO TAB --- */}
            {activeTab === "seo" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Focus Keyphrase
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !autoKeyphrase;
                                    onAutoKeyphraseChange?.(next);
                                    if (next) {
                                        const keyphrase =
                                            extractKeyphrase(title);
                                        if (keyphrase)
                                            setFocusKeyword(keyphrase);
                                    }
                                }}
                                className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
                                    autoKeyphrase
                                        ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                                title={
                                    autoKeyphrase
                                        ? "Auto-keyphrase ON — click to edit manually"
                                        : "Auto-keyphrase OFF — click to extract from title"
                                }
                            >
                                {autoKeyphrase ? (
                                    <Lock size={11} />
                                ) : (
                                    <Unlock size={11} />
                                )}
                                {autoKeyphrase ? "Auto" : "Manual"}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={focusKeyword}
                            readOnly={autoKeyphrase}
                            onChange={(e) => {
                                if (!autoKeyphrase)
                                    setFocusKeyword(e.target.value);
                            }}
                            placeholder="forex trading"
                            className={`w-full p-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary ${
                                autoKeyphrase
                                    ? "bg-emerald-50/50 dark:bg-emerald-500/5 text-gray-500 dark:text-gray-400"
                                    : "bg-gray-50 dark:bg-white/5"
                            }`}
                        />
                        {autoKeyphrase && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic mt-1">
                                Auto-extracted from title
                            </p>
                        )}
                    </div>
                    {/* Google Preview */}
                    <div className="bg-gray-50 dark:bg-[#0B0E14] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-600 uppercase">
                                Google Preview
                            </span>
                            <div className="flex bg-white dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-white/10 gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPreviewMode("mobile")}
                                    className={`p-1.5 h-auto w-auto rounded-lg ${previewMode === "mobile" ? "bg-indigo-50 text-indigo-500 hover:bg-indigo-50" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <Smartphone size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPreviewMode("desktop")}
                                    className={`p-1.5 h-auto w-auto rounded-lg ${previewMode === "desktop" ? "bg-indigo-50 text-indigo-500 hover:bg-indigo-50" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <Monitor size={14} />
                                </Button>
                            </div>
                        </div>

                        <div
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 max-w-full overflow-hidden ${previewMode === "mobile" ? "max-w-[320px] mx-auto" : ""}`}
                        >
                            <div className="flex items-center gap-1 text-[11px] text-[#202124] mb-1">
                                <span className="w-4 h-4 rounded-full bg-gray-200 block"></span>
                                <span className="line-clamp-1">
                                    example.com › articles ›{" "}
                                    {slug || "your-slug"}
                                </span>
                            </div>
                            <h3 className="text-[#1a0dab] text-lg font-normal leading-tight line-clamp-1 hover:underline cursor-pointer">
                                {title || "Article Title Placeholder"}
                            </h3>
                            <p className="text-[#4d5156] text-sm mt-1 line-clamp-2">
                                {metaDescription ||
                                    (content
                                        ? content
                                              .replace(/<[^>]*>?/gm, "")
                                              .substring(0, 160) + "..."
                                        : "Please provide a meta description.")}
                            </p>
                        </div>
                    </div>
                    {/* SEO Analysis Results */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3">
                            SEO Analysis
                        </h4>
                        <div className="space-y-2">
                            {seoAnalysis.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <div
                                        className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${
                                            item.status === "good"
                                                ? "bg-green-500"
                                                : item.status === "warning"
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* AI Generators */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onAiGenerate?.("title")}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 h-auto bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Wand2 size={12} /> Generate Title
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onAiGenerate?.("description")}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 h-auto bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Wand2 size={12} /> Generate Meta Desc
                        </Button>
                    </div>
                </div>
            )}

            {/* --- READABILITY TAB --- */}
            {activeTab === "readability" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3">
                            Readability Analysis
                        </h4>
                        <div className="space-y-2">
                            {readabilityAnalysis.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <div
                                        className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${
                                            item.status === "good"
                                                ? "bg-green-500"
                                                : item.status === "warning"
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4 italic">
                            *Analysis based on Flesch Reading Ease score and
                            basic sentence structure checks.
                        </p>
                    </div>
                </div>
            )}

            {/* --- AI-SEO TAB --- */}
            {activeTab === "aiSeo" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3">
                            AI-SEO (AEO & GEO) Analysis
                        </h4>
                        <div className="space-y-3">
                            {aiSeoAnalysis.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2.5 text-sm border-b border-gray-200 dark:border-white/10/30 pb-3 last:border-0 last:pb-0"
                                >
                                    <div
                                        className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                            item.status === "good"
                                                ? "bg-green-500"
                                                : item.status === "warning"
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 rounded-xl bg-purple-500/[0.05] border border-purple-500/10 dark:border-purple-500/20">
                            <h5 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                <Wand2 size={12} />
                                <span>What is AI-SEO?</span>
                            </h5>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                                AI-SEO optimizes your articles to be extracted
                                as featured answers in **Google AI Overviews
                                (AEO)** and cited as authoritative sources in
                                **ChatGPT, Claude, and Perplexity Search
                                (GEO)**. Keep answers direct, use comparison
                                tables, and cite concrete statistics.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SOCIAL TAB --- */}
            {activeTab === "social" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => setSocialPlatform("facebook")}
                            className={`flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${socialPlatform === "facebook" ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        >
                            <Facebook size={14} /> Facebook
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSocialPlatform("twitter")}
                            className={`flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${socialPlatform === "twitter" ? "bg-sky-50 text-sky-500 hover:bg-sky-100" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        >
                            <Twitter size={14} /> Twitter
                        </Button>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#0B0E14] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        {socialPlatform === "facebook" ? (
                            // Mock Facebook Preview
                            <div className="bg-white border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden max-w-[400px] mx-auto">
                                <div className="h-[200px] bg-gray-100 flex items-center justify-center relative">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-500 text-xs">
                                            OG Image (1200x630)
                                        </span>
                                    )}
                                </div>
                                <div className="p-3 bg-[#f0f2f5] border-t border-gray-200 dark:border-white/10">
                                    <div className="uppercase text-[10px] text-gray-600 mb-0.5">
                                        EXAMPLE.COM
                                    </div>
                                    <div className="font-bold text-sm text-[#050505] line-clamp-1">
                                        {title}
                                    </div>
                                    <div className="text-xs text-[#65676b] line-clamp-1">
                                        {metaDescription}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Mock Twitter Preview
                            <div className="bg-white border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden max-w-[400px] mx-auto">
                                <div className="h-[200px] bg-gray-100 flex items-center justify-center relative">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-500 text-xs">
                                            Twitter Image (1200x600)
                                        </span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="font-bold text-sm text-[#0f1419] line-clamp-1">
                                        {title}
                                    </div>
                                    <div className="text-xs text-[#536471] line-clamp-2 mt-0.5">
                                        {metaDescription}
                                    </div>
                                    <div className="text-xs text-[#536471] mt-1">
                                        example.com
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
