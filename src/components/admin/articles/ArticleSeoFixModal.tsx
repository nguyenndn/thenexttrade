"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, WandSparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
 ArticleSeoFixPayload,
 ArticleSeoFixSuggestion,
} from "@/lib/articles/article-seo-fix.shared";
import { getIssueLabel } from "@/lib/articles/article-readiness.shared";

interface ArticleSeoFixModalProps {
 suggestion: ArticleSeoFixSuggestion;
 isApplying: boolean;
 onApply: (payload: ArticleSeoFixPayload) => void;
 onRegenerate: () => void;
 onClose: () => void;
}

export function ArticleSeoFixModal({
 suggestion,
 isApplying,
 onApply,
 onRegenerate,
 onClose,
}: ArticleSeoFixModalProps) {
 const [formData, setFormData] = useState<ArticleSeoFixPayload>({
 metaTitle: suggestion.suggested.metaTitle,
 metaDescription: suggestion.suggested.metaDescription,
 focusKeyword: suggestion.suggested.focusKeyword,
 schemaType: suggestion.suggested.schemaType,
 excerpt: suggestion.suggested.excerpt,
 });

 useEffect(() => {
 setFormData({
 metaTitle: suggestion.suggested.metaTitle,
 metaDescription: suggestion.suggested.metaDescription,
 focusKeyword: suggestion.suggested.focusKeyword,
 schemaType: suggestion.suggested.schemaType,
 excerpt: suggestion.suggested.excerpt,
 });
 }, [suggestion]);

 const isMetaTitleValid = formData.metaTitle.length >= 10 && formData.metaTitle.length <= 70;
 const isMetaDescValid = formData.metaDescription.length >= 50 && formData.metaDescription.length <= 160;
 const isFocusKeywordValid = formData.focusKeyword.trim().length >= 2 && formData.focusKeyword.trim().length <= 80;
 const isExcerptValid = formData.excerpt.length >= 50 && formData.excerpt.length <= 240;

 const isValid = isMetaTitleValid && isMetaDescValid && isFocusKeywordValid && isExcerptValid;

 const handleApply = () => {
 if (isValid) {
 onApply(formData);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

 {/* Modal */}
 <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1E2028] border border-dashboard shadow-2xl flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard bg-white dark:bg-[#1E2028] sticky top-0 z-10 shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
 <WandSparkles size={18} className="text-blue-500" />
 </div>
 <div>
 <h2 className="text-base font-bold text-gray-800 dark:text-white">Fix SEO</h2>
 <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{suggestion.title}</p>
 </div>
 </div>
 <Button variant="outline" onClick={onClose} className="p-2 h-auto w-auto" aria-label="Close modal" disabled={isApplying}>
 <X size={16} />
 </Button>
 </div>

 {/* Content */}
 <div className="p-6 space-y-6 overflow-y-auto">
 {/* Detected Issues */}
 {suggestion.issues.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Detected Issues</h3>
 <div className="flex flex-wrap gap-2">
 {suggestion.issues.map((issue) => (
 <div key={issue} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-medium">
 <AlertTriangle size={12} />
 {getIssueLabel(issue)}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Form */}
 <div className="space-y-4">
 {/* Meta Title */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Meta Title</label>
 <span className={`text-xs ${isMetaTitleValid ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
 {formData.metaTitle.length}/60
 </span>
 </div>
 <input
 type="text"
 value={formData.metaTitle}
 onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
 className="w-full bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 placeholder="Enter meta title..."
 />
 </div>

 {/* Meta Description */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Meta Description</label>
 <span className={`text-xs ${isMetaDescValid ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
 {formData.metaDescription.length}/160
 </span>
 </div>
 <textarea
 value={formData.metaDescription}
 onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
 rows={3}
 className="w-full bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
 placeholder="Enter meta description..."
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Focus Keyword */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Focus Keyword</label>
 {!isFocusKeywordValid && <span className="text-xs text-red-500 font-bold">Required</span>}
 </div>
 <input
 type="text"
 value={formData.focusKeyword}
 onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
 className="w-full bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 placeholder="focus keyword"
 />
 </div>

 {/* Schema Type */}
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">Schema Type</label>
 <select
 value={formData.schemaType}
 onChange={(e) => setFormData({ ...formData, schemaType: e.target.value as any })}
 className="w-full bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
 >
 <option value="ARTICLE">Article</option>
 <option value="HOWTO">How-To</option>
 <option value="FAQ">FAQ</option>
 <option value="COURSE">Course</option>
 <option value="TOOL">Tool</option>
 <option value="REVIEW">Review</option>
 </select>
 </div>
 </div>

 {/* Excerpt */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Excerpt (Blog Grid)</label>
 <span className={`text-xs ${isExcerptValid ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
 {formData.excerpt.length}/200
 </span>
 </div>
 <textarea
 value={formData.excerpt}
 onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
 rows={3}
 className="w-full bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
 placeholder="Enter a brief excerpt..."
 />
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-6 py-4 border-t border-dashboard bg-gray-50 dark:bg-[#151925] rounded-b-2xl shrink-0">
 <Button variant="outline" onClick={onRegenerate} disabled={isApplying} className="gap-2">
 <WandSparkles size={14} />
 Regenerate
 </Button>
 
 <div className="flex items-center gap-3">
 <Button variant="outline" onClick={onClose} disabled={isApplying}>
 Cancel
 </Button>
 <Button variant="primary" onClick={handleApply} disabled={!isValid || isApplying} className="gap-2">
 {isApplying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
 Apply Fix
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
