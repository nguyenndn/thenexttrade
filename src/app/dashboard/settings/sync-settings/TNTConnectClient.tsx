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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function TNTConnectClient() {
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
        } catch {
            /* ignore */
        } finally {
            setIsLoading(false);
        }
    };

    const generateKey = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/sync/api-key", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setGeneratedKey(data.key);
            setShowFullKey(true);
            setKeyData({
                hasKey: true,
                key: data.key,
                fullKey: data.key,
                createdAt: new Date().toISOString(),
            });
            toast.success("Sync API key generated!");
        } catch (e: any) {
            toast.error(e.message || "Failed to generate key");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevokeClick = () => {
        setIsConfirmOpen(true);
    };

    const confirmRevoke = async () => {
        setIsConfirmOpen(false);
        setIsRevoking(true);
        try {
            const res = await fetch("/api/sync/api-key", { method: "DELETE" });
            if (!res.ok) throw new Error();
            setKeyData({
                hasKey: false,
                key: null,
                fullKey: null,
                createdAt: null,
            });
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

    const FEATURES = [
        {
            icon: Zap,
            label: "Auto Sync",
            desc: "Trades synced directly from MT5",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            icon: MonitorSmartphone,
            label: "EA Integrated",
            desc: "Runs directly on your charts",
            color: "text-cyan-500",
            bg: "bg-cyan-500/10",
        },
        {
            icon: Shield,
            label: "Unified Key",
            desc: "One key works for all accounts",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
    ];

    const STEPS = [
        {
            step: "1",
            text: "Generate your Sync API Key above",
            done: keyData.hasKey,
        },
        {
            step: "2",
            text: "Configure WebRequest in MetaTrader 5 (Tools > Options > Expert Advisors)",
            done: false,
        },
        {
            step: "3",
            text: "Drag Trade Manager EA onto your chart (e.g. XAUUSD)",
            done: false,
        },
        {
            step: "4",
            text: "Open the SYNC tab on the EA panel, paste your key, and click Connect",
            done: false,
        },
    ];

    return (
        <div className="w-full space-y-5">
            {/* ═══════════════════════════════════════════════════════════════════
 HERO BANNER
 ═══════════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm">
                {/* Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/8 dark:bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/6 dark:bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative px-6 py-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                            <Unplug size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-black tracking-tight text-gray-800 dark:text-white">
                                Sync API Key
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                Use this key inside Trade Manager EA to sync
                                trades automatically. One key works for all your
                                trading accounts.
                            </p>
                        </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        {FEATURES.map(
                            ({ icon: Icon, label, desc, color, bg }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-dashboard transition-colors hover:bg-gray-100/80 dark:hover:bg-white/[0.05]"
                                >
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                            bg
                                        )}
                                    >
                                        <Icon size={16} className={color} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-700 dark:text-white">
                                            {label}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
 API KEY MANAGEMENT
 ═══════════════════════════════════════════════════════════════════ */}
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-200/50 dark:ring-amber-500/20">
                            <Key size={15} className="text-amber-500" />
                        </div>
                        <h2 className="text-sm font-black tracking-tight text-gray-700 dark:text-white">
                            Sync API Key
                        </h2>
                    </div>

                    {!keyData.hasKey ? (
                        /* ── No key yet ── */
                        <div className="text-center py-10">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashboard flex items-center justify-center mb-5">
                                <Key
                                    size={28}
                                    className="text-gray-300 dark:text-gray-600"
                                />
                            </div>
                            <p className="text-sm font-bold text-gray-700 dark:text-white mb-1">
                                No API Key Generated
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                                Generate your Sync API Key to connect your Trade
                                Manager EA. One key works for all your trading
                                accounts.
                            </p>
                            <Button
                                onClick={generateKey}
                                variant="primary"
                                size="smd"
                                disabled={isGenerating}
                                className="shadow-lg shadow-primary/20"
                            >
                                {isGenerating ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Key size={16} />
                                )}
                                Generate API Key
                            </Button>
                        </div>
                    ) : (
                        /* ── Key exists ── */
                        <div className="space-y-4">
                            {/* Key display */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Your Sync API Key
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                showFullKey && generatedKey
                                                    ? generatedKey
                                                    : keyData.fullKey ||
                                                      keyData.key ||
                                                      ""
                                            }
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all select-all"
                                        />
                                    </div>
                                    <Button
                                        onClick={copyKey}
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 h-[46px] w-[46px] rounded-xl text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary border-dashboard"
                                        aria-label="Copy API Key"
                                    >
                                        {copied ? (
                                            <Check
                                                size={18}
                                                className="text-emerald-500"
                                            />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Show full key notice (only after generation) */}
                            {showFullKey && generatedKey && (
                                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                                    <AlertCircle
                                        size={18}
                                        className="text-amber-500 shrink-0 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                            Save your API key now!
                                        </p>
                                        <p className="text-xs mt-0.5 text-amber-600/70 dark:text-amber-400/60">
                                            This is the only time the full key
                                            will be shown. Copy it and paste
                                            into your Trade Manager EA settings
                                            under the SYNC tab.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Key info */}
                            {keyData.createdAt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Generated on{" "}
                                    {new Date(
                                        keyData.createdAt
                                    ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-dashboard">
                                <Button
                                    onClick={generateKey}
                                    variant="outline"
                                    size="smd"
                                    disabled={isGenerating}
                                    className="font-bold border-dashboard hover:border-primary/40 hover:text-primary dark:hover:text-primary"
                                >
                                    {isGenerating ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin mr-2"
                                        />
                                    ) : (
                                        <RefreshCw size={16} className="mr-2" />
                                    )}
                                    Regenerate
                                </Button>
                                <Button
                                    onClick={handleRevokeClick}
                                    variant="outline"
                                    size="smd"
                                    disabled={isRevoking}
                                    className="font-bold text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:border-red-500/40"
                                >
                                    {isRevoking ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin mr-2"
                                        />
                                    ) : (
                                        <Trash2 size={16} className="mr-2" />
                                    )}
                                    Revoke Key
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
 QUICK START
 ═══════════════════════════════════════════════════════════════════ */}
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center ring-1 ring-blue-200/50 dark:ring-blue-500/20">
                            <Download size={15} className="text-blue-500" />
                        </div>
                        <h2 className="text-sm font-black tracking-tight text-gray-700 dark:text-white">
                            Quick Start
                        </h2>
                    </div>

                    <ol className="space-y-3">
                        {STEPS.map(({ step, text, done }) => (
                            <li
                                key={step}
                                className="flex items-center gap-3.5"
                            >
                                <div
                                    className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                                        done
                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 ring-1 ring-gray-200/80 dark:ring-white/10"
                                    )}
                                >
                                    {done ? <Check size={13} /> : step}
                                </div>
                                <span
                                    className={cn(
                                        "text-sm",
                                        done
                                            ? "text-gray-400 dark:text-gray-500 line-through"
                                            : "text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {text}
                                </span>
                            </li>
                        ))}
                    </ol>

                    {/* Download button */}
                    <div className="mt-6 pt-4 border-t border-dashboard space-y-3">
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="/dashboard/trading-systems"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors shadow-sm shadow-primary/20"
                            >
                                <Download size={15} />
                                Go to Trading Systems to get Trade Manager
                            </a>
                            <a
                                href="/downloads/TheNextTrade_TradeSync.ex5"
                                download
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashboard hover:bg-gray-50 dark:hover:bg-white/[0.02] text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors"
                            >
                                <Download size={13} />
                                Download Trade Manager EA (.ex5)
                            </a>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Requires MetaTrader 5 installed · Runs on Windows or
                            VPS environments
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Revoke API Key"
                description="Are you sure? This will disconnect all active sync connections."
                confirmText="Revoke"
                cancelText="Cancel"
                onConfirm={confirmRevoke}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
