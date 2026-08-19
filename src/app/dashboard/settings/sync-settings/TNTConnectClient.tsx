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
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonVariants } from "@/components/ui/button-variants";

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

    // Interactive Onboarding Steps State
    const [manualCompletedSteps, setManualCompletedSteps] = useState<
        Record<string, boolean>
    >({});
    const [copiedUrl, setCopiedUrl] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("tnt_sync_quickstart_steps");
            if (saved) {
                setManualCompletedSteps(JSON.parse(saved));
            }
        } catch {
            /* ignore */
        }
    }, []);

    const toggleStep = (stepId: string) => {
        setManualCompletedSteps((prev) => {
            const next = { ...prev, [stepId]: !prev[stepId] };
            try {
                localStorage.setItem(
                    "tnt_sync_quickstart_steps",
                    JSON.stringify(next)
                );
            } catch {
                /* ignore */
            }
            return next;
        });
    };

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

    const syncApiUrl =
        typeof window !== "undefined"
            ? window.location.origin
            : "https://thenexttrade.com";

    const STEPS = [
        {
            id: "step-1",
            step: "1",
            title: "Generate your Sync API Key",
            description:
                "Create your unique 64-character EA synchronization key using the panel above.",
            done: keyData.hasKey || Boolean(manualCompletedSteps["step-1"]),
        },
        {
            id: "step-2",
            step: "2",
            title: "Configure WebRequest in MetaTrader 5",
            description:
                "In MT5 (Tools > Options > Expert Advisors), enable 'Allow WebRequest for listed URL' and add our URL.",
            done: Boolean(manualCompletedSteps["step-2"]),
            action: {
                label: copiedUrl ? "Copied!" : "Copy WebRequest URL",
                onClick: () => {
                    navigator.clipboard.writeText(syncApiUrl);
                    setCopiedUrl(true);
                    toast.success(`Copied ${syncApiUrl} to clipboard`);
                    setTimeout(() => setCopiedUrl(false), 2000);
                },
            },
        },
        {
            id: "step-3",
            step: "3",
            title: "Drag Trade Manager EA onto your chart",
            description:
                "Attach Trade Manager EA onto any active MT5 chart (e.g. XAUUSD) with Algo Trading enabled.",
            done: Boolean(manualCompletedSteps["step-3"]),
        },
        {
            id: "step-4",
            step: "4",
            title: "Open SYNC tab on EA panel & click Connect",
            description:
                "Paste your Sync API key into the EA panel inside MT5 and click Connect to start real-time trade syncing.",
            done: Boolean(manualCompletedSteps["step-4"]),
        },
    ];

    const completedCount = STEPS.filter((s) => s.done).length;
    const progressPercent = Math.round((completedCount / STEPS.length) * 100);

    return (
        <div className="w-full space-y-5">
            {/* ═══════════════════════════════════════════════════════════════════
 HERO BANNER
 ═══════════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm">
                {/* Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

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
                                    className="group flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-white dark:bg-[#252731] border border-gray-200 dark:border-white/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-300 hover:border-gray-200 dark:hover:border-white/10"
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                                            bg
                                        )}
                                    >
                                        <Icon size={18} className={color} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black tracking-tight text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                                            {label}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
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
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-200/50 dark:ring-amber-500/20">
                                <Key size={15} className="text-amber-500" />
                            </div>
                            <h2 className="text-sm font-black tracking-tight text-gray-700 dark:text-white">
                                Sync API Key
                            </h2>
                        </div>
                        {keyData.hasKey && (
                            <div className="flex items-center gap-2">
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
                        )}
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
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
 QUICK START (INTERACTIVE ONBOARDING CHECKLIST)
 ═══════════════════════════════════════════════════════════════════ */}
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="px-6 py-5">
                    {/* Header with Progress Indicator */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center ring-1 ring-blue-200/50 dark:ring-blue-500/20">
                                <Download size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black tracking-tight text-gray-800 dark:text-white">
                                    Quick Start Setup Guide
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Click any step to mark it as completed as you install
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar & Counter */}
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <div className="flex items-center gap-2.5">
                                <div className="w-24 bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            completedCount === STEPS.length
                                                ? "bg-emerald-500"
                                                : "bg-primary"
                                        )}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                                    {completedCount}/{STEPS.length} ({progressPercent}%)
                                </span>
                            </div>
                            {completedCount === STEPS.length && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 size={11} /> All Done!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Interactive Step Items */}
                    <div className="space-y-2.5">
                        {STEPS.map((stepItem) => {
                            const isDone = stepItem.done;
                            return (
                                <div
                                    key={stepItem.id}
                                    onClick={() => toggleStep(stepItem.id)}
                                    className={cn(
                                        "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                                        isDone
                                            ? "bg-emerald-500/[0.03] border-emerald-500/30 dark:bg-emerald-500/[0.05] dark:border-emerald-500/20 shadow-sm"
                                            : "bg-gray-50/60 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/5 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                        <button
                                            type="button"
                                            aria-label={`Mark step ${stepItem.step} as ${isDone ? "incomplete" : "complete"}`}
                                            className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all duration-200 mt-0.5 sm:mt-0",
                                                isDone
                                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                                                    : "bg-white dark:bg-[#1E2028] text-gray-400 dark:text-gray-500 ring-1 ring-gray-200 dark:ring-white/10 group-hover:ring-primary/40 group-hover:text-primary"
                                            )}
                                        >
                                            {isDone ? (
                                                <Check
                                                    size={14}
                                                    strokeWidth={3}
                                                />
                                            ) : (
                                                stepItem.step
                                            )}
                                        </button>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={cn(
                                                        "text-sm font-bold transition-colors",
                                                        isDone
                                                            ? "text-gray-900 dark:text-white"
                                                            : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                                    )}
                                                >
                                                    {stepItem.title}
                                                </span>
                                                {isDone && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <Check
                                                            size={9}
                                                            strokeWidth={3}
                                                        />{" "}
                                                        Done
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                                {stepItem.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action button inside step (e.g. Copy WebRequest URL) */}
                                    {stepItem.action && (
                                        <div
                                            className="sm:shrink-0 pl-10 sm:pl-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={
                                                    stepItem.action.onClick
                                                }
                                                className="h-8 px-3 text-xs font-semibold gap-1.5"
                                            >
                                                <Copy size={12} />
                                                {stepItem.action.label}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Download button */}
                    <div className="mt-6 pt-4 border-t border-dashboard space-y-3">
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="/dashboard/trading-systems"
                                className={buttonVariants({
                                    variant: "primary",
                                    size: "smd",
                                })}
                            >
                                <Download size={15} />
                                Go to Trading Systems to get Trade Manager
                            </a>
                            <a
                                href="/downloads/TheNextTrade_TradeSync.ex5"
                                download
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "smd",
                                })}
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
