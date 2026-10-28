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
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [syncMethod, setSyncMethod] = useState<SyncMethod>(
        defaultMethod || "EA_SYNC"
    );
    const isMobile = useIsMobileSyncDevice();
    const [linkSent, setLinkSent] = useState(false);

    // API Key states
    const [isLoadingKey, setIsLoadingKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [keyData, setKeyData] = useState<{
        hasKey: boolean;
        key: string | null;
        fullKey: string | null;
        createdAt: string | null;
    }>({ hasKey: false, key: null, fullKey: null, createdAt: null });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showFullKey, setShowFullKey] = useState(false);

    // Checkbox confirmation in step 2
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Verify step states
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setSyncMethod(defaultMethod || "EA_SYNC");
            setStep(1);
            setLinkSent(false);
        }
    }, [isOpen, defaultMethod]);

    // Track mobile sync warning viewed in accounts setup steps
    useEffect(() => {
        if (
            isOpen &&
            isMobile &&
            syncMethod === "EA_SYNC" &&
            (step === 1 || step === 2)
        ) {
            import("@/actions/first-session-onboarding").then((m) => {
                m.recordMobileSyncFallbackViewedAction(syncMethod);
            });
        }
    }, [isOpen, step, isMobile, syncMethod]);

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchKey();
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (isOpen && step === 3) {
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

    const handleCopyUrl = () => {
        const urlToCopy = syncServerUrl || "https://thenexttrade.com";
        navigator.clipboard.writeText(urlToCopy);
        setCopiedUrl(true);
        toast.success("WebRequest URL copied to clipboard!");
        setTimeout(() => setCopiedUrl(false), 2000);
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
        if (step < 3) {
            setStep((prev) => (prev + 1) as 1 | 2 | 3);
        } else {
            onClose();
            setStep(1);
            setIsConfirmed(false);
            setSyncStatus(null);
            toast.success("Setup wizard completed!");
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((prev) => (prev - 1) as 1 | 2 | 3);
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
                <div className="relative overflow-hidden bg-gray-50/70 dark:bg-white/[0.02] p-6 border-b border-dashboard">
                    <div className="flex items-center justify-between">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-white">
                                <Cable className="w-5 h-5 text-amber-500" />
                                Trade Manager Sync Setup
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                                3 steps to connect your MT5 account with Trade Manager EA.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Step Dots */}
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((s) => (
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
                    </div>
                </div>

                {/* Step Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* ═══════════════════════════════════════════════════════════════
 STEP 1: API KEY & ACCOUNT MATCHING
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {isMobile && syncMethod === "EA_SYNC" && (
                                <div className="p-4 rounded-lg border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
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
                            <div className="rounded-lg border border-dashboard bg-gray-50/50 dark:bg-white/[0.02] p-4">
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
                            <div className="rounded-lg border border-dashboard p-4 bg-white dark:bg-white/[0.01]">
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
                                            variant="gold"
                                            size="smd"
                                            onClick={() => {
                                                onOpenAddAccount?.(syncMethod);
                                            }}
                                            className="w-full sm:w-auto mx-auto"
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
 STEP 2: CONFIGURATION (Whitelist & WebRequest)
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {isMobile && syncMethod === "EA_SYNC" && (
                                <div className="p-4 rounded-lg border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
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

                            <div className="rounded-xl border border-dashboard bg-amber-500/[0.02] p-4 text-xs space-y-3.5">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                                        Step-by-Step MetaTrader 5 Setup
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                                        MetaTrader 5 blocks external network requests by default. Follow these 4 steps inside your MT5 terminal so Trade Manager EA can sync your live telemetry:
                                    </p>
                                </div>

                                <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-black/30 rounded-xl border border-dashboard">
                                    {/* Sub-step 1 */}
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                            1
                                        </span>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">
                                                Open Expert Advisors Options (<kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-white/10 border border-dashboard font-mono">Ctrl + O</kbd>)
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                In your MT5 top menu bar, click{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">
                                                    Tools &rarr; Options
                                                </strong>{" "}
                                                and switch to the{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">
                                                    Expert Advisors
                                                </strong>{" "}
                                                tab.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-step 2 */}
                                    <div className="flex items-start gap-2.5 pt-2 border-t border-dashboard">
                                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                            2
                                        </span>
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                                    Allow WebRequest &amp; Add Server URL
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    Tick{" "}
                                                    <strong className="text-gray-700 dark:text-gray-200">
                                                        &quot;Allow WebRequest for listed URL&quot;
                                                    </strong>
                                                    , double-click the green <strong className="text-emerald-600 dark:text-emerald-400">+</strong> row (&quot;add new URL&quot;), paste this exact URL, and click <strong className="text-gray-700 dark:text-gray-200">OK</strong>:
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-white dark:bg-black/40 px-2.5 py-2 rounded-lg border border-dashboard font-mono text-[11px] text-primary break-all">
                                                    {syncServerUrl || "https://thenexttrade.com"}
                                                </code>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCopyUrl}
                                                    className="shrink-0 text-xs font-bold h-8 px-2.5"
                                                >
                                                    {copiedUrl ? (
                                                        <>
                                                            <Check size={13} className="text-emerald-500" /> Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={13} /> Copy URL
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-step 3 */}
                                    <div className="flex items-start gap-2.5 pt-2 border-t border-dashboard">
                                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                            3
                                        </span>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">
                                                Enable Algo Trading &amp; Attach Trade Manager EA
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                Ensure <strong className="text-gray-700 dark:text-gray-200">Algo Trading</strong> is enabled (green play icon on the top toolbar), then drag{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">Trade Manager EA</strong> from{" "}
                                                <span className="font-mono text-[11px]">Navigator &rarr; Expert Advisors</span> onto any active chart.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-step 4 */}
                                    <div className="flex items-start gap-2.5 pt-2 border-t border-dashboard">
                                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                            4
                                        </span>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">
                                                Paste Sync API Key in the EA Panel
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                On the Trade Manager chart panel, open the{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">SYNC</strong> tab, paste your{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">Sync API Key</strong> from Step 1, and click{" "}
                                                <strong className="text-gray-700 dark:text-gray-200">Connect</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/[0.02] cursor-pointer group hover:bg-primary/[0.04] transition-colors">
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
 STEP 3: VERIFY
 ═══════════════════════════════════════════════════════════════ */}
                    {step === 3 && (
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
                            <div className="rounded-lg border border-dashboard p-4 space-y-3">
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
                                <div className="flex items-start gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20">
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
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
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
                    {/* Back / Cancel Button */}
                    {step > 1 ? (
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={handleBack}
                            className="flex items-center gap-1.5 font-bold"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={onClose}
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                    )}

                    {/* Next / Continue / Finish Button */}
                    <Button
                        variant="gold"
                        size="smd"
                        disabled={step === 2 && !isConfirmed}
                        onClick={handleNext}
                        className="font-bold flex items-center gap-2"
                    >
                        {step === 3
                            ? allChecksPassed
                                ? "Finish & Go to Dashboard"
                                : "Skip & Go to Dashboard"
                            : step === 2
                              ? "Continue to Verify"
                              : "Continue"}
                        <ArrowRight size={14} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
