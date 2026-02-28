"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Copy, Check, Server, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SyncModalProps {
    account: any;
    onClose: () => void;
}

export function SyncModal({ account, onClose }: SyncModalProps) {
    const [apiUrl, setApiUrl] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setApiUrl(`${window.location.origin}/api/mt5/sync`);
        }
    }, []);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`Copied ${field} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (!account) return null;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <RotateCwIcon className="animate-spin-slow" />
                        </div>
                        <DialogTitle>Connect MetaTrader 5</DialogTitle>
                    </div>
                    <p className="text-sm text-gray-500">
                        Use the details below to configure the <strong>GSN Sync EA</strong> on your MetaTrader terminal.
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* API URL */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sync Endpoint URL</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 group relative">
                            <Server size={16} className="text-gray-400" />
                            <code className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                                {apiUrl}
                            </code>
                            <button
                                onClick={() => copyToClipboard(apiUrl, "URL")}
                                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-primary"
                            >
                                {copiedField === "URL" ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Account ID */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account ID (Secret Key)</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 group relative">
                            <ShieldCheck size={16} className="text-gray-400" />
                            <code className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                                {account.id}
                            </code>
                            <button
                                onClick={() => copyToClipboard(account.id, "ID")}
                                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-primary"
                            >
                                {copiedField === "ID" ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                            Keep this ID safe. Anyone with this ID can upload trades to your journal.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-primary hover:bg-[#00B377] text-white font-bold rounded-xl transition-all"
                    >
                        Done
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function RotateCwIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    );
}
