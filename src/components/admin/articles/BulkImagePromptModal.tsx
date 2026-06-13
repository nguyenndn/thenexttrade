"use client";

import { trackEvent } from "@/lib/track";

import { useState } from "react";
import { X, Loader2, Copy, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getBulkArticleImagePrompts } from "@/actions/article-ops";

interface BulkImagePromptModalProps {
 articleIds: string[];
 open: boolean;
 onClose: () => void;
}

export function BulkImagePromptModal({ articleIds, open, onClose }: BulkImagePromptModalProps) {
 const [loading, setLoading] = useState(false);
 const [prompts, setPrompts] = useState<any[]>([]);
 const [phase, setPhase] = useState<"idle" | "loaded">("idle");

 const loadPrompts = async () => {
 setLoading(true);
 try {
 const result = await getBulkArticleImagePrompts(articleIds);
 setPrompts(result);
 setPhase("loaded");
 } catch {
 toast.error("Failed to generate prompts");
 } finally {
 setLoading(false);
 }
 };

 const copyAll = () => {
 const text = prompts
 .map((p) => {
 const lines = [`# ${p.title}`, `## Featured`, p.featured.prompt, `Path: ${p.featured.suggestedPath}`];
 p.inline.forEach((inl: any, i: number) => {
 lines.push(`## Inline ${i + 1}`, inl.prompt, `Path: ${inl.suggestedPath}`);
 });
 return lines.join("\n");
 })
 .join("\n\n---\n\n");

 navigator.clipboard.writeText(text);
 trackEvent("article_ops_bulk_image_prompts_exported", { surface: "article_ops", action: "copy_all", count: prompts.length });
 toast.success("Copied all prompts to clipboard");
 };

 const downloadJson = () => {
 const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `image-prompts-${Date.now()}.json`;
 a.click();
 URL.revokeObjectURL(url);
 trackEvent("article_ops_bulk_image_prompts_exported", { surface: "article_ops", action: "download_json", count: prompts.length });
 toast.success("Downloaded JSON");
 };

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-white dark:bg-[#0B0E14] rounded-2xl border border-dashboard w-full max-w-4xl max-h-[85vh] flex flex-col shadow-xl">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard">
 <h2 className="text-lg font-bold text-gray-800 dark:text-white">
 Bulk Image Prompts — {articleIds.length} articles
 </h2>
 <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
 <X size={18} className="text-gray-500" />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto p-6">
 {phase === "idle" && (
 <div className="text-center py-12">
 <p className="text-sm text-gray-500 mb-4">
 Generate image prompts for {articleIds.length} selected articles.
 </p>
 <Button
 variant="primary"
 onClick={loadPrompts}
 disabled={loading}
 className="gap-2"
 >
 {loading && <Loader2 size={16} className="animate-spin" />}
 Generate Prompts
 </Button>
 </div>
 )}

 {phase === "loaded" && (
 <div className="space-y-4">
 {prompts.map((p) => (
 <div
 key={p.articleId}
 className="rounded-xl border border-dashboard p-4"
 >
 <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 truncate">
 {p.title}
 </p>

 {/* Featured */}
 <div className="mb-2">
 <span className="text-[10px] font-bold uppercase text-primary">Featured</span>
 <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
 {p.featured.prompt}
 </p>
 <p className="text-[10px] text-gray-400 mt-0.5">Path: {p.featured.suggestedPath}</p>
 </div>

 {/* Inline */}
 {p.inline.map((inl: any, i: number) => (
 <div key={i} className="mb-1.5">
 <span className="text-[10px] font-bold uppercase text-amber-600">Inline {i + 1}</span>
 <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
 {inl.prompt}
 </p>
 <p className="text-[10px] text-gray-400 mt-0.5">Path: {inl.suggestedPath}</p>
 </div>
 ))}
 </div>
 ))}

 {prompts.length === 0 && (
 <div className="text-center py-8">
 <p className="text-sm text-gray-500">No prompts generated. Articles may not exist.</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dashboard">
 {phase === "loaded" && prompts.length > 0 && (
 <>
 <Button variant="outline" onClick={copyAll} className="gap-1.5">
 <Copy size={14} /> Copy All
 </Button>
 <Button variant="outline" onClick={downloadJson} className="gap-1.5">
 <Download size={14} /> Download JSON
 </Button>
 </>
 )}
 <Button variant="outline" onClick={onClose}>
 Close
 </Button>
 </div>
 </div>
 </div>
 );
}
