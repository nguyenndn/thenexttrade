"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
    Cable,
    Monitor,
    Download,
    ArrowRight,
    ArrowLeft,
    Key,
    Copy,
    Check,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Info,
    PenLine,
    Mail,
    Loader2,
    XCircle,
    HelpCircle,
    ExternalLink,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSyncServerUrl } from "@/lib/sync/sync-urls";
import { SyncTroubleshootingPanel } from "@/components/trading-accounts/SyncTroubleshootingPanel";
import { useIsMobileSyncDevice } from "@/lib/device";

interface TradingAccount {
    id: string;
    name: string;
    broker: string | null;
    accountNumber: string | null;
}

type SyncMethod = "EA_SYNC" | "MANUAL";

interface TradeSyncWizardProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: TradingAccount[];
    defaultMethod?: SyncMethod;
    onOpenAddAccount?: (method: SyncMethod) => void;
}

interface SyncStatus {
    hasApiKey: boolean;
    accountsCount: number;
    eaConnectedAccounts: number;
    lastHeartbeatAt: string | null;
    lastSyncAt: string | null;
    totalSyncedTrades: number;
}

export function TradeSyncWizard({
    isOpen,
    onClose,
    accounts,
    defaultMethod,
    onOpenAddAccount,
}: TradeSyncWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [syncMethod, setSyncMethod] = useState<SyncMethod>(
        defaultMethod || "EA_SYNC"
    );
    const isMobile = useIsMobileSyncDevice();
    const [linkSent, setLinkSent] = useState(false);

    // API Key states
    const [isLoadingKey, setIsLoadingKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [keyData, setKeyData] = useState<{
        hasKey: boolean;
        key: string | null;
        fullKey: string | null;
        createdAt: string | null;
    }>({ hasKey: false, key: null, fullKey: null, createdAt: null });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showFullKey, setShowFullKey] = useState(false);

    // Checkbox confirmation in step 3
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Verify step states
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            if (defaultMethod) setSyncMethod(defaultMethod);
            setLinkSent(false);
        }
    }, [isOpen, defaultMethod]);

    // Track mobile sync warning viewed in accounts setup steps
    useEffect(() => {
        if (
            isOpen &&
            isMobile &&
            syncMethod === "EA_SYNC" &&
            (step === 2 || step === 3)
        ) {
            import("@/actions/first-session-onboarding").then((m) => {
                m.recordMobileSyncFallbackViewedAction(syncMethod);
            });
        }
    }, [isOpen, step, isMobile, syncMethod]);

    useEffect(() => {
        if (isOpen && step === 2 && syncMethod !== "MANUAL") {
            fetchKey();
        }
    }, [isOpen, step, syncMethod]);

    useEffect(() => {
        if (isOpen && step === 4) {
            checkSyncStatus();
        }
    }, [isOpen, step]);

    const fetchKey = async () => {
        setIsLoadingKey(true);
        try {
            const res = await fetch("/api/sync/api-key");
            if (res.ok) {
                const data = await res.json();
                setKeyData(data);
            }
        } catch {
            toast.error("Failed to load Sync API Key");
        } finally {
            setIsLoadingKey(false);
        }
    };

    const handleGenerateKey = async () => {
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

    const handleCopyKey = () => {
        const keyToCopy = generatedKey || keyData.fullKey;
        if (keyToCopy) {
            navigator.clipboard.writeText(keyToCopy);
            setCopied(true);
            toast.success("API key copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const checkSyncStatus = useCallback(async () => {
        setIsCheckingStatus(true);
        try {
            const res = await fetch("/api/sync/status");
            if (res.ok) {
                const data = await res.json();
                setSyncStatus(data);
            }
        } catch {
            toast.error("Failed to check sync status");
        } finally {
            setIsCheckingStatus(false);
        }
    }, []);

    const handleNext = () => {
        // Manual skips step 2 and 3 — go directly to close
        if (syncMethod === "MANUAL" && step === 1) {
            onClose();
            setStep(1);
            toast.success("You can log trades manually from the Journal page.");
            return;
        }
        if (step < 4) {
            setStep((prev) => (prev + 1) as any);
        } else {
            onClose();
            setStep(1);
            setIsConfirmed(false);
            setSyncStatus(null);
            setShowTroubleshooting(false);
            toast.success("Setup wizard completed!");
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((prev) => (prev - 1) as any);
            setShowTroubleshooting(false);
        }
    };

    const syncServerUrl = getSyncServerUrl();

    // Verify step status checks
    const checks = syncStatus
        ? [
              { label: "API key generated", pass: syncStatus.hasApiKey },
              {
                  label: "MT5 account registered",
                  pass: syncStatus.accountsCount > 0,
              },
              {
                  label: "Heartbeat detected",
                  pass: !!syncStatus.lastHeartbeatAt,
              },
              {
                  label: "First trade synced",
                  pass: syncStatus.totalSyncedTrades > 0,
              },
          ]
        : [];

    const allChecksPassed = checks.length > 0 && checks.every((c) => c.pass);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-[#1E2028] border-dashboard shadow-2xl">
                {/* Wizard Steps Indicator */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-primary/5 to-cyan-500/10 p-6 border-b border-dashboard">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-white">
                                <Cable className="w-6 h-6 text-amber-500 animate-pulse" />
                                Interactive Sync Wizard
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                                {syncMethod === "MANUAL"
                                    ? "Log trades manually from the Journal page."
                                    : "4 steps to sync your MT5 trades automatically."}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Step Dots */}
                        {syncMethod !== "MANUAL" && (
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4].map((s) => (
                                    <div
                                        key={s}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            step === s
                                                ? "w-8 bg-amber-500 shadow-sm shadow-amber-500/30"
                                                : step > s
                                                  ? "w-2 bg-amber-500/50"
                                                  : "w-2 bg-gray-200 dark:bg-white/10"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Step Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* ═══════════════════════════════════════════════════════════════
 STEP 1: SELECT METHOD
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center max-w-md mx-auto mb-2">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    Choose your connection style
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Choose how you want to log and track your
                                    trading performance.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Option: MT5 Auto-Sync (Recommended) */}
                                <div
                                    onClick={() => setSyncMethod("EA_SYNC")}
                                    className={cn(
                                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-56",
                                        syncMethod === "EA_SYNC"
                                            ? "border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] shadow-lg shadow-amber-500/5"
                                            : "border-dashboard bg-transparent hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.01]"
                                    )}
                                >
                                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        Recommended
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cable
                                                size={18}
                                                className="text-amber-500 shrink-0"
                                            />
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                                MT5 Auto-Sync
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            Automatically sync your MT5 trades
                                            using the Sync tab in EA Trade
                                            Manager or the standalone
                                            lightweight TradeSync EA.
                                        </p>
                                    </div>
                                    <div className="pt-4 mt-auto">
                                        <a
                                            href="/downloads/TheNextTrade_TradeSync.ex5"
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-sm shadow-amber-500/20"
                                        >
                                            <Download size={13} />
                                            Download EA (.ex5)
                                        </a>
                                    </div>
                                </div>

                                {/* Option: Manual Journal */}
                                <div
                                    onClick={() => setSyncMethod("MANUAL")}
                                    className={cn(
                                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-56",
                                        syncMethod === "MANUAL"
                                            ? "border-primary bg-primary/[0.02] dark:bg-primary/[0.04] shadow-lg shadow-primary/5"
                                            : "border-dashboard bg-transparent hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.01]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <PenLine
                                                size={18}
                                                className="text-gray-400 shrink-0"
                                            />
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                                Manual Journal
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            No MT5 connection? Track and analyze
                                            your trades by logging them
                                            manually. You can set up auto-sync
                                            later anytime.
                                        </p>
                                    </div>
                                    <div className="pt-4 mt-auto">
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold group-hover:text-primary transition-colors">
                                            Select Option
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="rounded-xl h-11 px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="rounded-xl h-11 px-6 bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 gap-2"
                                    onClick={() => {
                                        if (syncMethod === "MANUAL") {
                                            onClose();
                                            onOpenAddAccount?.("MANUAL");
                                        } else {
                                            setStep(2);
                                        }
                                    }}
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
 STEP 2: API KEY & ACCOUNT MATCHING
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {isMobile && syncMethod === "EA_SYNC" && (
                                <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                                    <div className="flex gap-2.5 items-start">
                                        <Monitor size={18} className="mt-0.5 shrink-0 text-amber-500" />
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-amber-300 uppercase tracking-wider">
                                                Desktop Required for Auto-Sync
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                                                Because MetaTrader 5
                                                auto-syncing requires running
                                                our local helper app, setup must
                                                be completed on a{" "}
                                                <strong>
                                                    Windows Desktop or VPS
                                                </strong>
                                                .
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            size="sm"
                                            onClick={async () => {
                                                setIsLoadingKey(true);
                                                try {
                                                    const {
                                                        sendDesktopSetupLinkAction,
                                                    } =
                                                        await import("@/actions/first-session-onboarding");
                                                    const res =
                                                        await sendDesktopSetupLinkAction(
                                                            syncMethod
                                                        );
                                                    if (res.success) {
                                                        setLinkSent(true);
                                                        toast.success(
                                                            "Setup link sent to your email!"
                                                        );
                                                    } else {
                                                        toast.error(
                                                            res.error ||
                                                                "Failed to send email"
                                                        );
                                                    }
                                                } finally {
                                                    setIsLoadingKey(false);
                                                }
                                            }}
                                            disabled={linkSent}
                                            className="w-full text-xs font-extrabold h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
                                        >
                                            <Mail size={14} className="shrink-0" />
                                            {linkSent
                                                ? "Setup Link Sent!"
                                                : "Email Desktop Setup Link"}
                                        </Button>
                                        <Link
                                            href="/dashboard/journal?action=log-trade&source=mobile-fallback"
                                            className="w-full"
                                        >
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                size="sm"
                                                onClick={async () => {
                                                    const {
                                                        recordMobileSyncManualFallbackAction,
                                                    } =
                                                        await import("@/actions/first-session-onboarding");
                                                    await recordMobileSyncManualFallbackAction(
                                                        syncMethod
                                                    );
                                                    onClose();
                                                }}
                                                className="w-full text-xs font-bold h-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
                                            >
                                                <PenLine size={14} className="shrink-0" /> Log Manually instead
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* API Key Panel */}
                            <div className="rounded-xl border border-dashboard bg-gray-50/50 dark:bg-white/[0.02] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key size={16} className="text-amber-500" />
                                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Sync API Key
                                    </h3>
                                </div>

                                {isLoadingKey ? (
                                    <div className="flex items-center justify-center py-4">
                                        <RefreshCw
                                            className="animate-spin text-amber-500"
                                            size={20}
                                        />
                                    </div>
                                ) : !keyData.hasKey ? (
                                    <div className="text-center py-4 space-y-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            You don&apos;t have a Sync API Key
                                            generated yet.
                                        </p>
                                        <Button
                                            onClick={handleGenerateKey}
                                            variant="outline"
                                            size="sm"
                                            disabled={isGenerating}
                                            className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                        >
                                            {isGenerating
                                                ? "Generating..."
                                                : "Generate API Key"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
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
                                                className="flex-1 px-3 py-2 bg-white dark:bg-black/30 border border-dashboard rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 select-all focus:outline-none"
                                            />
                                            <Button
                                                onClick={handleCopyKey}
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 h-[36px] w-[36px] rounded-lg border-dashboard"
                                            >
                                                {copied ? (
                                                    <Check
                                                        size={14}
                                                        className="text-emerald-500"
                                                    />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </Button>
                                        </div>

                                        {showFullKey && generatedKey && (
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400">
                                                <AlertCircle
                                                    size={14}
                                                    className="shrink-0 mt-0.5"
                                                />
                                                <p>
                                                    Save this key now! This is
                                                    the only time it will be
                                                    shown in full.
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            This secret key connects your local
                                            MT5 sync app with your cloud
                                            dashboard. Keep it secret.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Account Reference Panel */}
                            <div className="rounded-xl border border-dashboard p-4 bg-white dark:bg-white/[0.01]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Info
                                            size={16}
                                            className="text-cyan-500"
                                        />
                                        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Your Registered Accounts
                                        </h3>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                        Match Required
                                    </span>
                                </div>

                                {accounts.length === 0 ? (
                                    <div className="text-center py-4 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-red-500 font-extrabold uppercase tracking-wider">
                                                No MT5 account registered
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                Add your MT5 account number
                                                first, then continue setup.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                onOpenAddAccount?.(syncMethod);
                                            }}
                                            className="w-full sm:w-auto h-11 rounded-xl bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] border-none text-xs font-black text-white hover:shadow-[0_4px_12px_rgba(217,154,38,0.2)] shadow-md active:scale-95 transition-all flex items-center justify-center mx-auto"
                                        >
                                            <Plus
                                                size={14}
                                                className="mr-1.5"
                                            />
                                            Add MT5 Account
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                        {accounts.map((acc) => (
                                            <div
                                                key={acc.id}
                                                className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-dashboard"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        {acc.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/20">
                                                    {acc.accountNumber}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
 STEP 3: CONFIGURATION (Whitelist & WebRequest)
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {isMobile && syncMethod === "EA_SYNC" && (
                                <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                                    <div className="flex gap-2.5 items-start">
                                        <Monitor size={18} className="mt-0.5 shrink-0 text-amber-500" />
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-amber-300 uppercase tracking-wider">
                                                Desktop Required for Auto-Sync
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                                                Because MetaTrader 5
                                                auto-syncing requires running
                                                our local helper app, setup must
                                                be completed on a{" "}
                                                <strong>
                                                    Windows Desktop or VPS
                                                </strong>
                                                .
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            size="sm"
                                            onClick={async () => {
                                                setIsLoadingKey(true);
                                                try {
                                                    const {
                                                        sendDesktopSetupLinkAction,
                                                    } =
                                                        await import("@/actions/first-session-onboarding");
                                                    const res =
                                                        await sendDesktopSetupLinkAction(
                                                            syncMethod
                                                        );
                                                    if (res.success) {
                                                        setLinkSent(true);
                                                        toast.success(
                                                            "Setup link sent to your email!"
                                                        );
                                                    } else {
                                                        toast.error(
                                                            res.error ||
                                                                "Failed to send email"
                                                        );
                                                    }
                                                } finally {
                                                    setIsLoadingKey(false);
                                                }
                                            }}
                                            disabled={linkSent}
                                            className="w-full text-xs font-extrabold h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
                                        >
                                            <Mail size={14} className="shrink-0" />
                                            {linkSent
                                                ? "Setup Link Sent!"
                                                : "Email Desktop Setup Link"}
                                        </Button>
                                        <Link
                                            href="/dashboard/journal?action=log-trade&source=mobile-fallback"
                                            className="w-full"
                                        >
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                size="sm"
                                                onClick={async () => {
                                                    const {
                                                        recordMobileSyncManualFallbackAction,
                                                    } =
                                                        await import("@/actions/first-session-onboarding");
                                                    await recordMobileSyncManualFallbackAction(
                                                        syncMethod
                                                    );
                                                    onClose();
                                                }}
                                                className="w-full text-xs font-bold h-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
                                            >
                                                <PenLine size={14} className="shrink-0" /> Log Manually instead
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-dashboard bg-amber-500/[0.02] p-4 text-xs space-y-3">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Configure MT5 allowed URLs (Crucial Step)
                                </h3>

                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    For security and stability, MetaTrader 5
                                    blocks external network requests by default.
                                    You must whitelist our secure API gateway:
                                </p>

                                <div className="space-y-2 p-3 bg-gray-50 dark:bg-black/30 rounded-lg border border-dashboard">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                        Path inside MetaTrader 5:
                                    </p>
                                    <p className="font-bold text-gray-700 dark:text-gray-300">
                                        Tools &gt; Options &gt; Expert Advisors
                                    </p>

                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3">
                                        1. Check the box:
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Allow WebRequest for listed URL:
                                    </p>

                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3">
                                        2. Add this URL:
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <code className="flex-1 bg-white dark:bg-black/40 p-2 rounded-lg border border-dashboard font-mono text-[11px] text-primary break-all">
                                            {syncServerUrl ||
                                                "https://thenexttrade.com"}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/[0.02] cursor-pointer group hover:bg-primary/[0.04] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) =>
                                        setIsConfirmed(e.target.checked)
                                    }
                                    className="w-4 h-4 mt-0.5 rounded-lg border-gray-300 text-primary focus:ring-primary shrink-0"
                                />
                                <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                                        I have configured MT5 correctly
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        I have added the secure URL to
                                        WebRequest list and pasted my Sync API
                                        Key into my EA settings.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
 STEP 4: VERIFY
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="text-center mb-2">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    Verify Connection
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Let&apos;s confirm everything is working
                                    correctly.
                                </p>
                            </div>

                            {/* Status Checks */}
                            <div className="rounded-xl border border-dashboard p-4 space-y-3">
                                {isCheckingStatus ? (
                                    <div className="flex items-center justify-center py-8 gap-2">
                                        <Loader2
                                            className="animate-spin text-amber-500"
                                            size={20}
                                        />
                                        <span className="text-xs text-gray-500">
                                            Checking sync status...
                                        </span>
                                    </div>
                                ) : syncStatus ? (
                                    <div className="space-y-2">
                                        {checks.map((c, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors",
                                                    c.pass
                                                        ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5"
                                                        : "border-dashboard bg-gray-50/50 dark:bg-white/[0.01]"
                                                )}
                                            >
                                                {c.pass ? (
                                                    <CheckCircle2
                                                        size={16}
                                                        className="text-emerald-500 shrink-0"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={16}
                                                        className="text-gray-300 dark:text-gray-600 shrink-0"
                                                    />
                                                )}
                                                <span
                                                    className={cn(
                                                        "text-xs font-semibold",
                                                        c.pass
                                                            ? "text-emerald-700 dark:text-emerald-400"
                                                            : "text-gray-400 dark:text-gray-500"
                                                    )}
                                                >
                                                    {c.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {/* Refresh button */}
                                <div className="flex justify-center pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={checkSyncStatus}
                                        disabled={isCheckingStatus}
                                        className="text-xs gap-1.5"
                                    >
                                        <RefreshCw
                                            size={12}
                                            className={
                                                isCheckingStatus
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                        Refresh Status
                                    </Button>
                                </div>
                            </div>

                            {/* Result messages */}
                            {syncStatus && allChecksPassed && (
                                <div className="flex items-start gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20">
                                    <CheckCircle2
                                        size={16}
                                        className="text-emerald-500 shrink-0 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            All checks passed!
                                        </p>
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                                            {syncStatus.totalSyncedTrades}{" "}
                                            trades synced. Your dashboard is
                                            ready.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {syncStatus && !allChecksPassed && (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                                        <AlertCircle
                                            size={14}
                                            className="text-amber-500 shrink-0 mt-0.5"
                                        />
                                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                            Some checks haven&apos;t passed yet.
                                            This is normal if you just set up —
                                            it may take a few minutes for the
                                            first heartbeat and trade to sync.
                                        </p>
                                    </div>

                                    <SyncTroubleshootingPanel
                                        method={syncMethod as "EA_SYNC"}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center p-6 border-t border-dashboard bg-gray-50/50 dark:bg-white/[0.01]">
                    {/* Back Button */}
                    {step > 1 ? (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {/* Next / Finish Button */}
                    {syncMethod === "MANUAL" && step === 1 ? (
                        <Link href="/dashboard/journal?action=log-trade">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    onClose();
                                    setStep(1);
                                }}
                                className="bg-gray-700 hover:bg-gray-800 text-white border-none flex items-center gap-1.5"
                            >
                                <PenLine size={14} />
                                Go to Journal
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant={
                                step === 3 || step === 4 ? "primary" : "outline"
                            }
                            disabled={step === 3 && !isConfirmed}
                            onClick={handleNext}
                            className={cn(
                                "flex items-center gap-1.5",
                                step >= 3
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 border-none"
                                    : "hover:border-primary hover:text-primary"
                            )}
                        >
                            {step === 4
                                ? allChecksPassed
                                    ? "Finish & Go to Dashboard"
                                    : "Skip & Go to Dashboard"
                                : step === 3
                                  ? "Continue to Verify"
                                  : "Continue"}
                            {step < 4 && <ArrowRight size={14} />}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
