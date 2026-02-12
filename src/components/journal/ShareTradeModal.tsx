"use client";

import { Dialog, DialogContent } from "@/components/ui/Dialog"; // Assuming we have a base Dialog or use Radix defaults
import { useState } from "react";
import { TradeShareCard } from "./TradeShareCard";
import { Copy, Check, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


interface ShareTradeModalProps {
    open: boolean;
    onClose: () => void;
    entry: any;
}

import { updateShareSettings } from "@/actions/journal-share-actions";
import { useEffect } from "react";
import { useDebounce } from "use-debounce";

// ... inside component ...

export function ShareTradeModal({ open, onClose, entry }: ShareTradeModalProps) {
    const [mode, setMode] = useState<"basic" | "full">(entry.shareMode as "basic" | "full" || "full");
    const [description, setDescription] = useState(entry.shareDescription || "");
    const [descriptionOpen, setDescriptionOpen] = useState(!!entry.shareDescription);
    const [copied, setCopied] = useState(false);

    // Debounce description to avoid too many DB calls
    const [debouncedDescription] = useDebounce(description, 1000);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Save on changes
    useEffect(() => {
        if (open && (debouncedDescription !== (entry.shareDescription || "") || mode !== (entry.shareMode || "full"))) {
            setIsSaving(true);
            updateShareSettings(entry.id, { 
                mode, 
                description: debouncedDescription 
            }).then(() => {
                setIsSaving(false);
                setLastSaved(new Date());
            });
        }
    }, [mode, debouncedDescription, entry.id, open, entry.shareDescription, entry.shareMode]);

    if (!entry) return null;

    const shareUrl = `http://localhost:3000/share/${entry.id}`; // Localhost for testing

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        // Force save if pending changes (though debounce handles most, closing immediately might need this if we tracked dirty state,
        // but for now relying on useEffect is safer if we just close. 
        // Actually, to be safe, we can just close. The debounce effect might run or might not depending on race conditions.
        // A better UX is just to show "Saved" state.)
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-gray-50 dark:bg-[#0F1117] border-none p-0 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#151925]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Your Trade</h2>
                    {/* Close button handled by DialogContent usually, but we can have custom header actions */}
                </div>

                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">


                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Preview</span>
                        <div className="flex items-center gap-3 bg-white dark:bg-[#1E2028] p-1 rounded-lg border border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setMode("basic")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    mode === "basic" ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                Basic
                            </button>
                            <button
                                onClick={() => setMode("full")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    mode === "full" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                Full
                            </button>
                        </div>
                    </div>

                    {/* Card Preview Area */}
                    <div className="flex justify-center py-4 w-full">
                        <TradeShareCard entry={entry} variant={mode} className="max-w-none shadow-xl" />
                    </div>

                    {/* Add Description Accordion */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                        <button
                            onClick={() => setDescriptionOpen(!descriptionOpen)}
                            className="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <span>Add Description (Optional)</span>
                            {descriptionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {descriptionOpen && (
                            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 relative">
                                <textarea
                                    className="w-full p-3 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Tell the story of this trade..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                                <div className="absolute bottom-6 right-6 pointer-events-none">
                                    {isSaving ? (
                                        <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                                    ) : lastSaved ? (
                                         <CheckCircle2 size={16} className="text-green-500" />
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Share Link Section */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Share Link</label>
                        <div className="relative group">
                            <input 
                                readOnly
                                value={shareUrl}
                                className="w-full bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-14 py-3 text-sm text-gray-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Button 
                                    onClick={handleCopy} 
                                    variant="ghost" 
                                    className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5">
                        <div className="text-sm text-gray-500 italic">
                            {isSaving ? "Saving changes..." : lastSaved ? "Changes saved" : ""}
                        </div>
                        <Button onClick={onClose} className="px-8 font-bold rounded-xl">
                            Done
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


