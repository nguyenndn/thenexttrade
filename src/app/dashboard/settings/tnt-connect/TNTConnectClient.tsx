"use client";

import { useState, useEffect } from "react";
import {
    Unplug,
    Key,
    Copy,
    Check,
    RefreshCw,
    Trash2,
    Loader2,
    Download,
    MonitorSmartphone,
    Zap,
    Shield,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TNTConnectClient() {
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [copied, setCopied] = useState(false);

    const [keyData, setKeyData] = useState<{
        hasKey: boolean;
        key: string | null;
        fullKey: string | null;
        createdAt: string | null;
    }>({ hasKey: false, key: null, fullKey: null, createdAt: null });

    // Show full key only once after generation
    const [showFullKey, setShowFullKey] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchKey();
    }, []);

    const fetchKey = async () => {
        try {
            const res = await fetch("/api/sync/api-key");
            if (res.ok) {
                const data = await res.json();
                setKeyData(data);
            }
        } catch { /* ignore */ }
        finally { setIsLoading(false); }
    };

    const generateKey = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/sync/api-key", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setGeneratedKey(data.key);
            setShowFullKey(true);
            setKeyData({ hasKey: true, key: data.key, fullKey: data.key, createdAt: new Date().toISOString() });
            toast.success("Sync API key generated!");
        } catch (e: any) {
            toast.error(e.message || "Failed to generate key");
        } finally {
            setIsGenerating(false);
        }
    };

    const revokeKey = async () => {
        if (!confirm("Are you sure? This will disconnect all TNT Connect apps.")) return;
        setIsRevoking(true);
        try {
            const res = await fetch("/api/sync/api-key", { method: "DELETE" });
            if (!res.ok) throw new Error();
            setKeyData({ hasKey: false, key: null, fullKey: null, createdAt: null });
            setShowFullKey(false);
            setGeneratedKey(null);
            toast.success("Sync API key revoked");
        } catch {
            toast.error("Failed to revoke key");
        } finally {
            setIsRevoking(false);
        }
    };

    const copyKey = () => {
        const keyToCopy = generatedKey || keyData.fullKey;
        if (keyToCopy) {
            navigator.clipboard.writeText(keyToCopy);
            setCopied(true);
            toast.success("API key copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={28} />
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">

            {/* ── Hero Banner ── */}
            <div className="relative bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-transparent dark:from-emerald-500/10 dark:via-cyan-500/5 dark:to-transparent" />
                <div className="relative px-6 py-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                            <Unplug size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">TNT Connect</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Sync your MT5 trades automatically — no EA needed. Download the desktop app, paste your API key, and you&apos;re connected.
                            </p>
                        </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        {[
                            { icon: Zap, label: "Auto Sync", desc: "Trades synced every 10s" },
                            { icon: MonitorSmartphone, label: "Background Mode", desc: "MT5 runs silently" },
                            { icon: Shield, label: "One API Key", desc: "All accounts, one key" },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <Icon size={16} className="text-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-700 dark:text-white">{label}</p>
                                    <p className="text-[10px] text-gray-400">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── API Key Management ── */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                            <Key size={14} className="text-amber-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-700 dark:text-white">Sync API Key</h2>
                    </div>

                    {!keyData.hasKey ? (
                        /* ── No key yet ── */
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center mb-4">
                                <Key size={28} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-1">No API Key Generated</p>
                            <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
                                Generate your Sync API Key to connect the TNT Connect desktop app.
                                One key works for all your trading accounts.
                            </p>
                            <Button
                                onClick={generateKey}
                                variant="primary"
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                                Generate API Key
                            </Button>
                        </div>
                    ) : (
                        /* ── Key exists ── */
                        <div className="space-y-4">

                            {/* Key display */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                                    Your Sync API Key
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={showFullKey && generatedKey ? generatedKey : (keyData.key || "")}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono text-gray-700 dark:text-gray-300 focus:outline-none select-all"
                                        />
                                    </div>
                                    <Button
                                        onClick={copyKey}
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                    </Button>
                                </div>
                            </div>

                            {/* Show full key notice (only after generation) */}
                            {showFullKey && generatedKey && (
                                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Save your API key now!</p>
                                        <p className="text-xs mt-0.5 opacity-80">
                                            This is the only time the full key will be shown. Copy it and paste into your TNT Connect app.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Key info */}
                            {keyData.createdAt && (
                                <p className="text-xs text-gray-400">
                                    Generated on {new Date(keyData.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                                    })}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                                <Button
                                    onClick={generateKey}
                                    variant="outline"
                                    size="sm"
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    Regenerate
                                </Button>
                                <Button
                                    onClick={revokeKey}
                                    variant="ghost"
                                    size="sm"
                                    disabled={isRevoking}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    {isRevoking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Revoke Key
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── How to Use ── */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                            <Download size={14} className="text-blue-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-700 dark:text-white">Quick Start</h2>
                    </div>

                    <ol className="space-y-3">
                        {[
                            { step: "1", text: "Generate your Sync API Key above", done: keyData.hasKey },
                            { step: "2", text: "Download TNT Connect for Windows", done: false },
                            { step: "3", text: "Run the app → Right-click tray icon → Settings → Paste API Key", done: false },
                            { step: "4", text: "Done! Your MT5 trades will sync automatically", done: false },
                        ].map(({ step, text, done }) => (
                            <li key={step} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                                    done
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 dark:bg-white/10 text-gray-400"
                                )}>
                                    {done ? <Check size={12} /> : step}
                                </div>
                                <span className={cn(
                                    "text-sm",
                                    done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"
                                )}>{text}</span>
                            </li>
                        ))}
                    </ol>

                    {/* Download button (placeholder) */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/10">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info("Download will be available soon!")}
                        >
                            <Download size={14} />
                            Download TNT Connect for Windows
                        </Button>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Requires Windows 10/11 · MetaTrader 5 installed · ~50MB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
