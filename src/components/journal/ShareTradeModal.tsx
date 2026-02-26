"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog"; // Assuming we have a base Dialog or use Radix defaults
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useRef } from "react";
import { TradeShareCard } from "./TradeShareCard";
import { Copy, Check, ChevronDown, ChevronUp, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import * as htmlToImage from "html-to-image";


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

    // Screenshot state
    const [isCapturing, setIsCapturing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        
        try {
            setIsCapturing(true);
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 3, 
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1E2028' : '#ffffff',
                style: {
                    margin: '0',
                }
            });
            
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `Trade-${entry.symbol}-${entry.externalTicket || entry.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Trade image saved successfully!");
        } catch (error) {
            console.error("Screenshot error:", error);
            toast.error("Failed to capture image");
        } finally {
            setIsCapturing(false);
        }
    };

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
                {/* 
                  A11y Requirement: Radix DialogContent requires a DialogTitle. 
                  Since we build our own visual header below, we hide the official one for screen readers.
                */}
                <VisuallyHidden>
                    <DialogTitle>Share Trade</DialogTitle>
                    <DialogDescription>Share your trade details securely.</DialogDescription>
                </VisuallyHidden>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#151925]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Your Trade</h2>
                    {/* Close button handled by DialogContent usually, but we can have custom header actions */}
                </div>

                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">


                    {/* Controls Row */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Preview</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                disabled={isCapturing}
                                className="h-10 px-4 rounded-[14px] font-bold text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                            >
                                {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Download
                            </Button>
                            <div className="flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-black/20 p-1.5 rounded-[18px] w-[180px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => setMode("basic")}
                                    className={`flex-1 rounded-[14px] font-bold transition-all h-8 !px-0 ${mode === "basic" ? "bg-white dark:bg-[#1E2028] text-primary shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-transparent"}`}
                                >
                                    Basic
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setMode("full")}
                                    className={`flex-1 rounded-[14px] font-bold transition-all h-8 !px-0 ${mode === "full" ? "bg-white dark:bg-[#1E2028] text-primary shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-transparent"}`}
                                >
                                    Full
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Card Preview Area */}
                    <div className="flex justify-center py-4 w-full rounded-2xl bg-white dark:bg-[#1E2028]" ref={cardRef}>
                        <TradeShareCard entry={entry} variant={mode} className="max-w-none shadow-xl" />
                    </div>

                    {/* Add Description Accordion */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300 shadow-sm">
                        <button 
                            type="button"
                            onClick={() => setDescriptionOpen(!descriptionOpen)} 
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Add Description (Optional)</span>
                            <div className={`transition-transform duration-300 ${descriptionOpen ? "rotate-180" : ""}`}>
                                <ChevronDown size={16} className="text-gray-400" />
                            </div>
                        </button>
                        
                        <div className={`grid transition-all duration-300 ease-in-out ${descriptionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                            <div className="overflow-hidden">
                                <div className="p-4 relative bg-gray-50/50 dark:bg-black/10 border-t border-gray-100 dark:border-white/5">
                                    <textarea
                                        className="w-full p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all shadow-sm font-medium"
                                        rows={3}
                                        placeholder="Tell the story of this trade..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                    <div className="absolute bottom-6 right-6 pointer-events-none">
                                        {isSaving ? (
                                            <span className="text-xs text-gray-500 font-medium px-2 py-1 rounded-md bg-white/80 dark:bg-[#1E2028]/90 backdrop-blur-sm shadow-sm flex items-center gap-1 animate-pulse border border-gray-100 dark:border-white/10">Saving...</span>
                                        ) : lastSaved ? (
                                             <div className="bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-sm rounded-full p-0.5 shadow-sm border border-green-100 dark:border-green-500/20">
                                                <CheckCircle2 size={16} className="text-green-500" />
                                             </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                    variant="outline" 
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


