"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CloudSync,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Server,
    Clock,
    Calendar,
    Hash,
    Building2,
    Monitor,
    AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import {
    saveCloudSyncCredentials,
    triggerCloudSync,
    getCloudSyncStatus,
    cancelCloudSyncJob,
} from "@/actions/cloud-sync";
import { ServerCombobox } from "@/components/trading-accounts/ServerCombobox";
import { detectBroker } from "@/lib/ea/broker-detection";
import {
    BROKER_INFO,
    SupportedBroker,
} from "@/lib/validations/vip-request";

interface CloudSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: {
        id: string;
        name: string;
        accountNumber?: string | null;
        server?: string | null;
        broker?: string | null;
        company?: string | null;
        currency?: string | null;
        platform?: string | null;
        syncSource?: string | null;
        lastSync?: string | Date | null;
        hasCredentials?: boolean;
        latestJob?: any | null;
    };
    onUpdated?: () => void;
    onSyncStarted?: (accountId: string, jobId?: string) => void;
    onRequestSupport?: (accountId: string) => void;
}

export function CloudSyncModal({
    isOpen,
    onClose,
    account,
    onUpdated,
    onSyncStarted,
    onRequestSupport,
}: CloudSyncModalProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [syncPeriod, setSyncPeriod] = useState("30");
    const [customFromDate, setCustomFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split("T")[0];
    });
    const [customToDate, setCustomToDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const initialHasCredentials = Boolean(account.hasCredentials);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [hasCredentials, setHasCredentials] = useState(initialHasCredentials);
    const [isEditingPassword, setIsEditingPassword] = useState(!initialHasCredentials);
    const [latestJob, setLatestJob] = useState<any>(account.latestJob || null);
    const [jobWaitSeconds, setJobWaitSeconds] = useState(0);
    const [server, setServer] = useState(account.server || "");
    const [broker, setBroker] = useState<string | null>(account.broker || null);
    const [isEditingServer, setIsEditingServer] = useState(!account.server);

    const effectiveBroker = useMemo(() => {
        if (broker) return broker;
        if (account.broker) return account.broker;
        const s = server || account.server;
        if (s) return detectBroker(s, account.company || "");
        return null;
    }, [broker, account.broker, account.company, server, account.server]);

    const brokerDisplayName = effectiveBroker
        ? BROKER_INFO[effectiveBroker as SupportedBroker]?.name ?? effectiveBroker
        : account.broker
        ? BROKER_INFO[account.broker as SupportedBroker]?.name ?? account.broker
        : "Unassigned";

    const [isCancelling, setIsCancelling] = useState(false);

    const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleCancelSync = async () => {
        setIsCancelling(true);
        try {
            const res = await cancelCloudSyncJob(account.id);
            if (res.success) {
                toast.info("Sync cancelled.");
                setLatestJob((prev: any) =>
                    prev
                        ? {
                              ...prev,
                              status: "FAILED",
                              errorMessage: "Sync cancelled by user.",
                          }
                        : null
                );
                setIsSyncing(false);
            } else {
                toast.error(res.error || "Failed to cancel sync.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel sync.");
        } finally {
            setIsCancelling(false);
        }
    };

    // Refresh sync status when opened
    useEffect(() => {
        if (!isOpen || !account.id) return;
        let isMounted = true;
        
        // Adopt props immediately so there is zero layout jump or morphing
        const credsConfigured = Boolean(account.hasCredentials);
        setHasCredentials(credsConfigured);
        setIsEditingPassword(!credsConfigured);
        setLatestJob(account.latestJob || null);
        setLoadingStatus(false);

        setPassword("");
        setServer(account.server || "");
        setBroker(account.broker || null);
        setIsEditingServer(!account.server);
        setJobWaitSeconds(0);

        getCloudSyncStatus(account.id)
            .then((res) => {
                if (!isMounted) return;
                if (res.success) {
                    const credsConfigured = Boolean(res.hasCredentials);
                    setHasCredentials(credsConfigured);
                    if (account.hasCredentials === undefined) {
                        setIsEditingPassword(!credsConfigured);
                    }
                    if (res.latestJob) {
                        setLatestJob(res.latestJob);
                    }
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoadingStatus(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, account.id, account.hasCredentials, account.server, account.broker, account.latestJob]);

    // Timer to track seconds waiting for worker when job is PENDING
    useEffect(() => {
        if (!isOpen || !latestJob || latestJob.status !== "PENDING") {
            setJobWaitSeconds(0);
            if (waitTimerRef.current) clearInterval(waitTimerRef.current);
            return;
        }

        waitTimerRef.current = setInterval(() => {
            setJobWaitSeconds((prev) => prev + 1);
        }, 1000);

        return () => {
            if (waitTimerRef.current) clearInterval(waitTimerRef.current);
        };
    }, [isOpen, latestJob?.status]);

    // Poll active job status if job is PENDING or PROCESSING
    useEffect(() => {
        if (!isOpen || !latestJob) return;
        if (latestJob.status !== "PENDING" && latestJob.status !== "PROCESSING")
            return;

        const interval = setInterval(async () => {
            const res = await getCloudSyncStatus(account.id);
            if (res.success && res.latestJob) {
                setLatestJob(res.latestJob);
                if (
                    res.latestJob.status === "COMPLETED" ||
                    res.latestJob.status === "FAILED"
                ) {
                    setIsSyncing(false);
                    if (res.latestJob.status === "COMPLETED") {
                        toast.success(
                            `Cloud sync completed: ${res.latestJob.dealsReceived || 0} deals synced.`
                        );
                        onUpdated?.();
                    } else {
                        toast.error(
                            res.latestJob.errorMessage ||
                                "Cloud sync failed. Please check server or investor password."
                        );
                    }
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isOpen, latestJob, account.id, onUpdated]);

    // Unified handle for saving password and/or triggering sync
    const handleAction = async () => {
        const effectiveServer = server.trim() || account.server?.trim() || "";
        if (!effectiveServer) {
            toast.error("Please select or enter your MT5 Broker Server.");
            return;
        }

        // If user is entering a new password or updating server
        const needSavePassword = !hasCredentials || (isEditingPassword && password.trim().length > 0);
        const needSaveServer = effectiveServer !== (account.server || "");

        if (needSavePassword || needSaveServer) {
            if (needSavePassword && !password.trim()) {
                toast.error("Please enter your investor password (passview).");
                return;
            }

            setIsSaving(true);
            try {
                const saveRes = await saveCloudSyncCredentials(
                    account.id,
                    password.trim() || undefined,
                    effectiveServer,
                    effectiveBroker || undefined
                );
                if (!saveRes.success) {
                    toast.error(saveRes.error || "Failed to save credentials.");
                    setIsSaving(false);
                    return;
                }
                if (needSavePassword) {
                    setHasCredentials(true);
                    setIsEditingPassword(false);
                    setPassword("");
                }
                setIsEditingServer(false);
                toast.success("Credentials saved.");
            } catch (err: any) {
                toast.error(err.message || "Failed to save credentials.");
                setIsSaving(false);
                return;
            } finally {
                setIsSaving(false);
            }
        }

        // Validate Custom Date Range if selected
        if (syncPeriod === "custom") {
            if (!customFromDate) {
                toast.error("Please select a From Date.");
                return;
            }
            if (customToDate && customFromDate > customToDate) {
                toast.error("From Date cannot be after To Date.");
                return;
            }
        }

        // Trigger Sync Job
        setIsSyncing(true);
        setJobWaitSeconds(0);
        try {
            const customRange =
                syncPeriod === "custom"
                    ? { from: customFromDate, to: customToDate }
                    : undefined;
            const syncRes = await triggerCloudSync(account.id, syncPeriod, customRange);
            if (syncRes.success) {
                toast.info("Sync started in background. Monitoring progress...");
                setLatestJob({
                    id: syncRes.jobId,
                    status: "PENDING",
                    createdAt: new Date().toISOString(),
                    message: "Queued for worker pickup...",
                });
                onSyncStarted?.(account.id, syncRes.jobId);
                onUpdated?.();
                onClose();
            } else {
                toast.error(syncRes.error || "Failed to trigger sync.");
                setIsSyncing(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger sync.");
            setIsSyncing(false);
        }
    };

    const isJobActive =
        isSyncing ||
        Boolean(
            latestJob &&
                (latestJob.status === "PENDING" ||
                    latestJob.status === "PROCESSING") &&
                latestJob.createdAt &&
                Date.now() - new Date(latestJob.createdAt).getTime() <
                    (latestJob.status === "PENDING" ? 60000 : 120000)
        );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                            <CloudSync className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                                Cloud Sync
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                                Automated trade history sync via cloud assistant
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Previous Failure Notice */}
                {latestJob?.status === "FAILED" && !isJobActive && (
                    <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                        {latestJob.errorCode === "JOB_TIMEOUT" ? "Sync Timed Out" : "Sync Failed"}
                                    </span>
                                    {latestJob.createdAt && (
                                        <span className="text-[10px] text-rose-500/80 font-normal">
                                            • {formatDistanceToNow(new Date(latestJob.createdAt), { addSuffix: true, locale: enUS })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] leading-relaxed mt-0.5 text-rose-600/90 dark:text-rose-300/90">
                                    {latestJob.errorMessage || latestJob.message || "The sync worker was unable to complete this request."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Specs - 2 rows x 2 columns (UI matches AccountSettingsModal) */}
                <div className="mt-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-dashboard divide-y divide-gray-200/60 dark:divide-white/5 text-xs overflow-hidden">
                    {/* Row 1: Account Number & Broker */}
                    <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
                        <div className="px-4 py-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                <Hash size={12} className="text-gray-400 shrink-0" />
                                Account Number
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums block truncate">
                                #{account.accountNumber || "N/A"}
                            </span>
                        </div>
                        <div className="px-4 py-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                <Building2 size={12} className="text-gray-400 shrink-0" />
                                Broker
                            </span>
                            <span
                                className="font-semibold text-gray-800 dark:text-gray-200 block truncate"
                                title={brokerDisplayName}
                            >
                                {brokerDisplayName}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Active Server & Platform & Base */}
                    <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
                        <div className="px-4 py-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                <Server size={12} className="text-gray-400 shrink-0" />
                                Active Server
                            </span>
                            <span
                                className="font-semibold text-gray-800 dark:text-gray-200 font-mono block truncate"
                                title={server || account.server || "Not configured"}
                            >
                                {server || account.server || "Not configured"}
                            </span>
                        </div>
                        <div className="px-4 py-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                <Monitor size={12} className="text-gray-400 shrink-0" />
                                Platform & Base
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                                {account.platform || "MT5"} ({account.currency || "USD"})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Server Selection if missing or editing */}
                {(!account.server || isEditingServer) && (
                    <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    MT5 Broker Server <span className="text-red-500">*</span>
                                </label>
                                {effectiveBroker && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                        {effectiveBroker}
                                    </span>
                                )}
                            </div>
                            {account.server && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsEditingServer(false);
                                        setServer(account.server || "");
                                        setBroker(account.broker || null);
                                    }}
                                    className="h-5 px-1.5 text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-white rounded-lg"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                        <ServerCombobox
                            value={server}
                            onChange={(val, b) => {
                                setServer(val);
                                if (b) {
                                    setBroker(b);
                                } else if (val) {
                                    const detected = detectBroker(val, account.company || "");
                                    setBroker(detected || null);
                                } else {
                                    setBroker(null);
                                }
                            }}
                            label=""
                            required
                            placeholder="e.g. STARTRADERFinancial-Live, Exness-Real10"
                            helperText="Select or enter the exact MT5 server name (type broker name to search)"
                        />
                    </div>
                )}

                {/* Credentials Section - Only shown if not configured or explicitly editing */}
                {(!hasCredentials || isEditingPassword) && (
                    <div className="mt-2.5 space-y-2">
                        {loadingStatus && account.hasCredentials === undefined ? (
                            <div className="h-12 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02] flex items-center justify-center gap-2">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-400" />
                                <span className="text-xs text-gray-400">Verifying credentials...</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        MT5 Investor Password (Passview)
                                    </label>
                                    {hasCredentials && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setIsEditingPassword(false);
                                                setPassword("");
                                            }}
                                            className="h-6 px-2 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-white rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>

                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your investor password (passview)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-10 rounded-xl h-9 text-xs"
                                        autoFocus={isEditingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                <div className="rounded-xl border border-gray-200/70 bg-gray-50/50 p-2 text-[11px] leading-relaxed text-gray-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-400">
                                    <div className="flex items-start gap-2">
                                        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                                        <span>
                                            Provide your read-only <strong>passview</strong> to enable automated Cloud Sync.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sync Period (Data Filter) */}
                <div className="mt-2.5 space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>Sync Period</span>
                    </label>
                    <Select value={syncPeriod} onValueChange={setSyncPeriod}>
                        <SelectTrigger className="w-full rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border-dashboard h-9 text-xs">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Today</SelectItem>
                            <SelectItem value="3">Last 3 Days</SelectItem>
                            <SelectItem value="7">Last Week (7 Days)</SelectItem>
                            <SelectItem value="30">Last Month (30 Days)</SelectItem>
                            <SelectItem value="90">Last 3 Months (90 Days)</SelectItem>
                            <SelectItem value="180">Last 6 Months (180 Days)</SelectItem>
                            <SelectItem value="all">Entire History</SelectItem>
                            <SelectItem value="custom">Custom Date Range (From - To)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Custom Date Range Picker (From - To) */}
                    {syncPeriod === "custom" && (
                        <div className="grid grid-cols-2 gap-2 pt-1.5">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span>From Date</span>
                                </label>
                                <Input
                                    type="date"
                                    value={customFromDate}
                                    max={customToDate || undefined}
                                    onChange={(e) => setCustomFromDate(e.target.value)}
                                    className="rounded-xl text-xs h-8.5 bg-gray-50/50 dark:bg-white/[0.03] border-dashboard font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span>To Date</span>
                                </label>
                                <Input
                                    type="date"
                                    value={customToDate}
                                    min={customFromDate || undefined}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setCustomToDate(e.target.value)}
                                    className="rounded-xl text-xs h-8.5 bg-gray-50/50 dark:bg-white/[0.03] border-dashboard font-medium"
                                />
                            </div>
                        </div>
                    )}
                </div>


                {/* Manual Sync Support Request Trigger */}
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-2 text-xs dark:border-white/5 dark:bg-white/[0.02]">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        Sync failing or connection timeout?
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onRequestSupport?.(account.id);
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                        Request Manual Sync Support
                    </button>
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-3 flex gap-2">
                    {isJobActive && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelSync}
                            disabled={isCancelling}
                            className="rounded-xl h-10 px-3.5 text-xs font-semibold border-red-500/30 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Sync"}
                        </Button>
                    )}
                    <Button
                        onClick={handleAction}
                        disabled={
                            isJobActive ||
                            isSaving ||
                            (!hasCredentials && !password.trim()) ||
                            !(server.trim() || account.server)
                        }
                        className="flex-1 rounded-xl gap-2 font-bold h-10 shadow-sm"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isJobActive ? "animate-spin" : ""}`}
                        />
                        {isJobActive
                            ? "Syncing via Worker..."
                            : isSaving
                              ? "Saving Password..."
                              : !hasCredentials || (isEditingPassword && password.trim())
                                ? "Save & Sync Trade History"
                                : "Sync Trade History Now"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
