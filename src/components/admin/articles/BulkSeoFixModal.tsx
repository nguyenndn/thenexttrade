"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";
import {
 generateBulkArticleSeoFixSuggestions,
 applyBulkArticleSeoFixes,
 undoBulkArticleSeoFix,
} from "@/actions/article-ops";
import type { ArticleSeoFixSuggestion } from "@/lib/articles/article-seo-fix.shared";

interface BulkSeoFixModalProps {
 articleIds: string[];
 open: boolean;
 onClose: () => void;
 onApplied: () => void;
}

type ApplyResult = {
 batchId: string;
 updated: { articleId: string; title: string }[];
 errors: { articleId: string; message: string }[];
};

type UndoResult = {
 restored: { articleId: string; title: string }[];
 skipped: { articleId: string; title?: string; message: string }[];
};

function FieldDiff({ label, current, suggested }: { label: string; current: string | null; suggested: string }) {
 const changed = (current || "") !== suggested;
 if (!changed) return null;
 return (
 <div className="text-xs">
 <span className="font-semibold text-gray-500">{label}:</span>
 <div className="grid grid-cols-2 gap-2 mt-0.5">
 <span className="text-red-500/70 line-through line-clamp-1">{current || "—"}</span>
 <span className="text-emerald-600 dark:text-emerald-400 line-clamp-1">{suggested}</span>
 </div>
 </div>
 );
}

export function BulkSeoFixModal({ articleIds, open, onClose, onApplied }: BulkSeoFixModalProps) {
 const [loading, setLoading] = useState(false);
 const [applying, setApplying] = useState(false);
 const [undoing, setUndoing] = useState(false);
 const [suggestions, setSuggestions] = useState<ArticleSeoFixSuggestion[]>([]);
 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [genErrors, setGenErrors] = useState<{ articleId: string; message: string }[]>([]);
 const [phase, setPhase] = useState<"idle" | "review" | "done" | "undone">("idle");
 const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
 const [undoResult, setUndoResult] = useState<UndoResult | null>(null);

 const loadSuggestions = async () => {
 setLoading(true);
 try {
 const result = await generateBulkArticleSeoFixSuggestions(articleIds);
 setSuggestions(result.suggestions);
 setGenErrors(result.errors);
 setSelected(new Set(result.suggestions.map((s) => s.articleId)));
 setPhase("review");
 } catch {
 toast.error("Failed to generate suggestions");
 } finally {
 setLoading(false);
 }
 };

 const applySelected = async () => {
 const payloads = suggestions
 .filter((s) => selected.has(s.articleId))
 .map((s) => ({
 articleId: s.articleId,
 payload: s.suggested,
 }));

 if (payloads.length === 0) {
 toast.error("No articles selected");
 return;
 }

 setApplying(true);
 try {
 const result = await applyBulkArticleSeoFixes(payloads);
 setApplyResult(result);
 trackEvent("article_ops_bulk_seo_applied", {
 surface: "article_ops",
 action: "apply_bulk_seo",
 count: result.updated.length,
 errors: result.errors.length,
 });
 toast.success(`Fixed ${result.updated.length} articles`);
 if (result.errors.length > 0) {
 toast.error(`${result.errors.length} articles failed`);
 }
 setPhase("done");
 onApplied();
 } catch {
 toast.error("Failed to apply fixes");
 } finally {
 setApplying(false);
 }
 };

 const handleUndo = async () => {
 if (!applyResult) return;
 setUndoing(true);
 try {
 const result = await undoBulkArticleSeoFix(applyResult.batchId);
 setUndoResult(result);
 trackEvent("article_ops_bulk_seo_undone", {
 surface: "article_ops",
 action: "undo_bulk_seo",
 count: result.restored.length,
 skipped: result.skipped.length,
 });
 toast.success(`Restored ${result.restored.length} articles`);
 setPhase("undone");
 onApplied();
 } catch {
 toast.error("Failed to undo batch");
 } finally {
 setUndoing(false);
 }
 };

 const toggleSelect = (id: string) => {
 setSelected((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 };

 const toggleAll = () => {
 if (selected.size === suggestions.length) {
 setSelected(new Set());
 } else {
 setSelected(new Set(suggestions.map((s) => s.articleId)));
 }
 };

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-white dark:bg-[#0B0E14] rounded-2xl border border-dashboard w-full max-w-4xl max-h-[85vh] flex flex-col shadow-xl">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard">
 <h2 className="text-lg font-bold text-gray-800 dark:text-white">
 Bulk Fix SEO — {articleIds.length} articles
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
 Generate SEO fix suggestions for {articleIds.length} selected articles.
 </p>
 <Button
 variant="primary"
 onClick={loadSuggestions}
 disabled={loading}
 className="gap-2"
 >
 {loading && <Loader2 size={16} className="animate-spin" />}
 Generate Suggestions
 </Button>
 </div>
 )}

 {phase === "review" && (
 <div className="space-y-3">
 {/* Select all header */}
 <div className="flex items-center justify-between mb-2">
 <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
 <input
 type="checkbox"
 checked={selected.size === suggestions.length}
 onChange={toggleAll}
 className="rounded border-gray-300 text-primary focus:ring-primary"
 />
 Select All ({selected.size}/{suggestions.length})
 </label>
 <div className="text-[10px] font-bold uppercase text-gray-400 flex gap-4">
 <span className="text-red-400">Current</span>
 <span className="text-emerald-500">Suggested</span>
 </div>
 </div>

 {/* Suggestions with old vs new */}
 {suggestions.map((s) => (
 <div
 key={s.articleId}
 className={`rounded-xl border p-4 transition-colors ${
 selected.has(s.articleId)
 ? "border-primary/30 bg-primary/5"
 : "border-dashboard "
 }`}
 >
 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 checked={selected.has(s.articleId)}
 onChange={() => toggleSelect(s.articleId)}
 className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
 />
 <div className="flex-1 min-w-0 space-y-1.5">
 <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
 {s.title}
 </p>
 <FieldDiff label="Meta Title" current={s.current.metaTitle} suggested={s.suggested.metaTitle} />
 <FieldDiff label="Focus Keyword" current={s.current.focusKeyword} suggested={s.suggested.focusKeyword} />
 <FieldDiff label="Meta Description" current={s.current.metaDescription} suggested={s.suggested.metaDescription} />
 <FieldDiff label="Schema" current={s.current.schemaType} suggested={s.suggested.schemaType} />
 <FieldDiff label="Excerpt" current={s.current.excerpt} suggested={s.suggested.excerpt} />
 {s.notes.length > 0 && (
 <div className="mt-1.5 flex flex-wrap gap-1">
 {s.notes.map((n, i) => (
 <span key={i} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
 {n}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 ))}

 {genErrors.length > 0 && (
 <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
 <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
 <AlertCircle size={14} /> {genErrors.length} errors
 </p>
 {genErrors.map((e) => (
 <p key={e.articleId} className="text-xs text-red-500 mt-1">{e.articleId}: {e.message}</p>
 ))}
 </div>
 )}
 </div>
 )}

 {phase === "done" && applyResult && (
 <div className="text-center py-12 space-y-4">
 <CheckCircle2 size={48} className="text-primary mx-auto" />
 <div>
 <p className="text-sm font-bold text-gray-800 dark:text-white">
 Fixed {applyResult.updated.length} articles
 </p>
 <p className="text-xs text-gray-500 mt-1 font-mono">
 Batch ID: {applyResult.batchId.slice(0, 8)}...
 </p>
 </div>
 {applyResult.errors.length > 0 && (
 <p className="text-xs text-red-500">{applyResult.errors.length} articles had errors</p>
 )}
 <Button
 variant="outline"
 onClick={handleUndo}
 disabled={undoing}
 className="gap-1.5"
 >
 {undoing ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
 Undo This Batch
 </Button>
 </div>
 )}

 {phase === "undone" && undoResult && (
 <div className="text-center py-12 space-y-3">
 <Undo2 size={40} className="text-amber-500 mx-auto" />
 <p className="text-sm font-bold text-gray-800 dark:text-white">
 Restored {undoResult.restored.length} articles
 </p>
 {undoResult.skipped.length > 0 && (
 <div className="text-left max-w-sm mx-auto mt-2 space-y-1">
 <p className="text-xs font-semibold text-amber-600">{undoResult.skipped.length} skipped:</p>
 {undoResult.skipped.map((s) => (
 <p key={s.articleId} className="text-xs text-gray-500">{s.title || s.articleId}: {s.message}</p>
 ))}
 </div>
 )}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dashboard">
 {phase === "review" && (
 <Button
 variant="primary"
 size="smd"
 onClick={applySelected}
 disabled={applying || selected.size === 0}
 className="gap-2 font-bold"
 >
 {applying && <Loader2 size={14} className="animate-spin mr-1" />}
 Apply {selected.size} Selected
 </Button>
 )}
 <Button variant="outline" size="smd" onClick={onClose} className="font-bold">
 {phase === "done" || phase === "undone" ? "Close" : "Cancel"}
 </Button>
 </div>
 </div>
 </div>
 );
}
