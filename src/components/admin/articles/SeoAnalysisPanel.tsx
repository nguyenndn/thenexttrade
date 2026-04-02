"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Search, Smartphone, Monitor, Facebook, Twitter, Wand2, Eye, FileText, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SeoProps {
    focusKeyword: string;
    setFocusKeyword: (val: string) => void;
    title: string;
    slug: string;
    metaDescription: string;
    content: string; // HTML content
    thumbnail?: string;
    onAiGenerate?: (field: 'title' | 'description') => void;
}

export function SeoAnalysisPanel({ focusKeyword, setFocusKeyword, title, slug, metaDescription, content, thumbnail, onAiGenerate }: SeoProps) {
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [activeTab, setActiveTab] = useState<'seo' | 'readability' | 'social'>('seo');
    const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'twitter'>('facebook');

    const [seoAnalysis, setSeoAnalysis] = useState<{ label: string; status: 'good' | 'bad' | 'warning' }[]>([]);
    const [readabilityAnalysis, setReadabilityAnalysis] = useState<{ label: string; status: 'good' | 'bad' | 'warning' }[]>([]);

    // --- SEO Analysis Logic ---
    useEffect(() => {
        if (!focusKeyword && activeTab === 'seo') {
            setSeoAnalysis([]);
            return;
        }

        const keyword = focusKeyword ? focusKeyword.toLowerCase() : "";
        const checks: { label: string; status: 'good' | 'bad' | 'warning' }[] = [];

        if (keyword) {
            // 1. Keyword in Title
            if (title.toLowerCase().includes(keyword)) {
                checks.push({ label: "Focus keyphrase in SEO title", status: 'good' });
            } else {
                checks.push({ label: "Focus keyphrase not in SEO title", status: 'bad' });
            }

            // 2. Keyword in Slug
            if (slug.toLowerCase().includes(keyword.replace(/\s+/g, '-'))) {
                checks.push({ label: "Keyphrase in slug", status: 'good' });
            } else {
                checks.push({ label: "Keyphrase not in slug", status: 'warning' });
            }

            // 3. Keyword in Meta Description
            if (metaDescription.toLowerCase().includes(keyword)) {
                checks.push({ label: "Keyphrase in meta description", status: 'good' });
            } else if (metaDescription.length === 0) {
                checks.push({ label: "Meta description not specified", status: 'bad' });
            } else {
                checks.push({ label: "Keyphrase not in meta description", status: 'warning' });
            }
        } else {
            checks.push({ label: "Please set a focus keyphrase to see SEO analysis.", status: 'warning' });
        }

        // 4. Content Length
        const textContent = content.replace(/<[^>]*>?/gm, '');
        const wordCount = textContent.split(/\s+/).length;

        if (wordCount > 300) {
            checks.push({ label: "Text length: Good job!", status: 'good' });
        } else {
            checks.push({ label: `Text length: ${wordCount} words (recommended: 300+)`, status: 'warning' });
        }

        setSeoAnalysis(checks);

    }, [focusKeyword, title, slug, metaDescription, content, activeTab]);

    // --- Readability Analysis Logic (PRO) ---
    useEffect(() => {
        const textContent = content.replace(/<[^>]*>?/gm, '');
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = textContent.split(/\s+/).filter(w => w.length > 0);
        const syllables = words.reduce((acc, word) => acc + (word.match(/[aeiouy]{1,2}/g)?.length || 1), 0);

        const checks: { label: string; status: 'good' | 'bad' | 'warning' }[] = [];

        // 1. Flesch Reading Ease
        // Formula: 206.835 - 1.015(total words / total sentences) - 84.6(total syllables / total words)
        const totalSentences = sentences.length || 1;
        const totalWords = words.length || 1;
        const avgSentenceLength = totalWords / totalSentences;
        const avgSyllablesPerWord = syllables / totalWords;

        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

        if (fleschScore >= 60) {
            checks.push({ label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Easy to read)`, status: 'good' });
        } else if (fleschScore >= 30) {
            checks.push({ label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Moderately difficult)`, status: 'warning' });
        } else {
            checks.push({ label: `Flesch Reading Ease: ${fleschScore.toFixed(1)} (Very difficult)`, status: 'bad' });
        }

        // 2. Sentence Length
        const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
        const longSentenceRatio = (longSentences / totalSentences) * 100;

        if (longSentenceRatio < 25) {
            checks.push({ label: `Sentence length: Great!`, status: 'good' });
        } else {
            checks.push({ label: `Sentence length: ${longSentenceRatio.toFixed(1)}% of sentences contain more than 20 words (try to shorten).`, status: 'warning' });
        }

        // 3. Passive Voice (Basic Regex Detection)
        // Matches: is/are/was/were/be/been/being + past participle (ed) - VERY basic approximation
        const passiveMatches = textContent.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi);
        const passiveCount = passiveMatches ? passiveMatches.length : 0;
        const passiveRatio = (passiveCount / totalSentences) * 100; // Rough ratio

        if (passiveRatio < 10) {
            checks.push({ label: "Passive voice: Good amount.", status: 'good' });
        } else {
            checks.push({ label: `Passive voice: Found ${passiveCount} instances (try to use active voice).`, status: 'warning' });
        }

        setReadabilityAnalysis(checks);

    }, [content, activeTab]);


    return (
        <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                    <Search size={20} className="text-primary" />
                    Yoast SEO (Pro)
                </h3>
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('seo')}
                        className={`px-3 py-1.5 h-auto rounded-md text-xs font-bold transition-all ${activeTab === 'seo' ? 'bg-white text-primary shadow-sm hover:bg-white hover:text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        SEO
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('readability')}
                        className={`px-3 py-1.5 h-auto rounded-md text-xs font-bold transition-all ${activeTab === 'readability' ? 'bg-white text-primary shadow-sm hover:bg-white hover:text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Readability
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('social')}
                        className={`px-3 py-1.5 h-auto rounded-md text-xs font-bold transition-all ${activeTab === 'social' ? 'bg-white text-primary shadow-sm hover:bg-white hover:text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Social
                    </Button>
                </div>
            </div>

            {/* --- SEO TAB --- */}
            {activeTab === 'seo' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Focus Keyphrase</label>
                        <input
                            type="text"
                            value={focusKeyword}
                            onChange={e => setFocusKeyword(e.target.value)}
                            placeholder="forex trading"
                            className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    {/* Google Preview */}
                    <div className="bg-gray-50 dark:bg-[#0B0E14] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-600 uppercase">Google Preview</span>
                            <div className="flex bg-white dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-white/10 gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setPreviewMode('mobile')} className={`p-1.5 h-auto w-auto rounded ${previewMode === 'mobile' ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}><Smartphone size={14} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setPreviewMode('desktop')} className={`p-1.5 h-auto w-auto rounded ${previewMode === 'desktop' ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}><Monitor size={14} /></Button>
                            </div>
                        </div>

                        <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-w-full overflow-hidden ${previewMode === 'mobile' ? 'max-w-[320px] mx-auto' : ''}`}>
                            <div className="flex items-center gap-1 text-[11px] text-[#202124] mb-1">
                                <span className="w-4 h-4 rounded-full bg-gray-200 block"></span>
                                <span className="line-clamp-1">example.com › articles › {slug || 'your-slug'}</span>
                            </div>
                            <h3 className="text-[#1a0dab] text-lg font-normal leading-tight line-clamp-1 hover:underline cursor-pointer">
                                {title || "Article Title Placeholder"}
                            </h3>
                            <p className="text-[#4d5156] text-sm mt-1 line-clamp-2">
                                {metaDescription || (content ? content.replace(/<[^>]*>?/gm, '').substring(0, 160) + "..." : "Please provide a meta description.")}
                            </p>
                        </div>
                    </div>
                    {/* SEO Analysis Results */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3">SEO Analysis</h4>
                        <div className="space-y-2">
                            {seoAnalysis.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${item.status === 'good' ? 'bg-green-500' :
                                        item.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                        }`} />
                                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* AI Generators */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onAiGenerate?.('title')}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 h-auto bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Wand2 size={12} /> Generate Title
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onAiGenerate?.('description')}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 h-auto bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Wand2 size={12} /> Generate Meta Desc
                        </Button>
                    </div>
                </div>
            )}

            {/* --- READABILITY TAB --- */}
            {activeTab === 'readability' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3">Readability Analysis</h4>
                        <div className="space-y-2">
                            {readabilityAnalysis.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${item.status === 'good' ? 'bg-green-500' :
                                        item.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                        }`} />
                                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4 italic">
                            *Analysis based on Flesch Reading Ease score and basic sentence structure checks.
                        </p>
                    </div>
                </div>
            )}

            {/* --- SOCIAL TAB --- */}
            {activeTab === 'social' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => setSocialPlatform('facebook')}
                            className={`flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${socialPlatform === 'facebook' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Facebook size={14} /> Facebook
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSocialPlatform('twitter')}
                            className={`flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg text-xs font-bold transition-all ${socialPlatform === 'twitter' ? 'bg-sky-50 text-sky-500 hover:bg-sky-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Twitter size={14} /> Twitter
                        </Button>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#0B0E14] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        {socialPlatform === 'facebook' ? (
                            // Mock Facebook Preview
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-[400px] mx-auto">
                                <div className="h-[200px] bg-gray-100 flex items-center justify-center relative">
                                    {thumbnail ? (
                                        <img src={thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-500 text-xs">OG Image (1200x630)</span>
                                    )}
                                </div>
                                <div className="p-3 bg-[#f0f2f5] border-t border-gray-100">
                                    <div className="uppercase text-[10px] text-gray-600 mb-0.5">EXAMPLE.COM</div>
                                    <div className="font-bold text-sm text-[#050505] line-clamp-1">{title}</div>
                                    <div className="text-xs text-[#65676b] line-clamp-1">{metaDescription}</div>
                                </div>
                            </div>
                        ) : (
                            // Mock Twitter Preview
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-[400px] mx-auto">
                                <div className="h-[200px] bg-gray-100 flex items-center justify-center relative">
                                    {thumbnail ? (
                                        <img src={thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-500 text-xs">Twitter Image (1200x600)</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="font-bold text-sm text-[#0f1419] line-clamp-1">{title}</div>
                                    <div className="text-xs text-[#536471] line-clamp-2 mt-0.5">{metaDescription}</div>
                                    <div className="text-xs text-[#536471] mt-1">example.com</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
