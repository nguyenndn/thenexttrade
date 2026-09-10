"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import {
    Plus,
    RefreshCw,
    Wallet,
    Crown,
    CheckCircle2,
    Lock,
    Clock3,
    Cable,
    Activity,
    ArrowRight,
    ArrowUpRight,
    Users,
    LifeBuoy,
} from "lucide-react";
import { SyncHealthCenter } from "./SyncHealthCenter";
import { AccountTable } from "./AccountTable";
import { AddAccountModal } from "./AddAccountModal";
import { SyncSupportDrawer } from "./SyncSupportDrawer";
import { getUserSupportSyncTickets } from "@/actions/support-sync";
import { cn } from "@/lib/utils";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { RegenerateKeyModal } from "./RegenerateKeyModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { TradeSyncWizard } from "./TradeSyncWizard";
import { useRouter, useSearchParams } from "next/navigation";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { setMainAccount } from "@/actions/main-account";
import { useProAccess } from "@/components/pro/ProProvider";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";
import { isSyncHealthCenterEnabled } from "@/lib/feature-flags";
import { getCloudSyncStatus, cancelCloudSyncJob } from "@/actions/cloud-sync";

interface TradingAccount {
    id: string;
    name: string;
    platform: string;
    broker: string | null;
    accountNumber: string | null;
    status: string;
    lastHeartbeat: string | null;
    lastSync: string | null;
    totalTrades: number;
    isConnected: boolean;
    color?: string | null;
    autoSync?: boolean;
    server?: string | null;
    balance?: number | null;
    equity?: number | null;
    accountType?: string | null;
    syncSource?: string | null;
    appLastHeartbeat?: string | null;
    eaVersion?: string | null;
    useForLeaderboard?: boolean;
    eligibility?: any;
    eaAccess?: string;
    proStatus?: string;
    proSource?: string | null;
    proExpiresAt?: string | null;
    vipStatus?: string | null;
    createdAt?: string;
    isDefault?: boolean;
    currency?: string;
    maxDailyLoss?: number | null;
    maxDailyTrades?: number | null;
    maxRiskPercent?: number | null;
    cooldownAfterLosses?: number | null;
    hasCredentials?: boolean;
    latestJob?: any | null;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface AccountListClientProps {
    initialAccounts: TradingAccount[];
    meta?: Meta;
    userEmail?: string;
    userName?: string;
    userTelegramId?: string;
    userCountry?: string;
    mainAccountId?: string | null;
    preferredSyncMethod?: SyncMethod;
}

type SyncMethod = "EA_SYNC" | "MANUAL";

const getSyncMethodFromQuery = (
    method: string | null,
    preferredSyncMethod?: SyncMethod
): SyncMethod => {
    if (method === "ea") return "EA_SYNC";
    if (method === "manual") return "MANUAL";
    return preferredSyncMethod ?? "EA_SYNC";
};

export function AccountListClient({
    initialAccounts,
    meta,
    userEmail,
    userName,
    userTelegramId,
    userCountry,
    mainAccountId: initialMainId,
    preferredSyncMethod,
}: AccountListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const proAccess = useProAccess();
    const [mainAccountId, setMainAccountId] = useState<string | null>(
        initialMainId ?? null
    );

    const MAX_FREE_ACCOUNTS = 3;
    const isPro = proAccess.isPro;
    const isFreeLimitReached =
        !isPro && initialAccounts.length >= MAX_FREE_ACCOUNTS;

    type ModalState =
        | { type: "NONE" }
        | {
            type: "ADD";
            initialMode?: "chooser" | "free" | "pro" | "upgrade-pro";
            sourceAccount?: TradingAccount;
        }
        | { type: "SETTINGS"; account: TradingAccount }
        | { type: "REGEN"; accountId: string }
        | { type: "DELETE"; accountId: string }
        | { type: "FREE_VS_PRO" }
        | { type: "SYNC_SETUP" }
        | { type: "SYNC_HEALTH" };

    const [activeModal, setActiveModal] = useState<ModalState>({
        type: "NONE",
    });

    const [defaultSyncMethod, setDefaultSyncMethod] = useState<
        SyncMethod | undefined
    >(preferredSyncMethod);
    const [wasInSyncSetup, setWasInSyncSetup] = useState(false);

    // Support Sync Drawer state
    const [supportDrawerOpen, setSupportDrawerOpen] = useState(false);
    const [supportDrawerAccountId, setSupportDrawerAccountId] = useState<string | null>(null);
    const [supportDrawerTab, setSupportDrawerTab] = useState<"list" | "create">("list");
    const [userTickets, setUserTickets] = useState<any[]>([]);

    const loadUserTickets = async () => {
        try {
            const tickets = await getUserSupportSyncTickets();
            setUserTickets(tickets || []);
        } catch {
            // Ignore error
        }
    };

    useEffect(() => {
        loadUserTickets();
    }, []);

    const pendingSupportCount = userTickets.filter((t) => t.status === "PENDING").length;

    // Track accounts actively syncing in background: accountId -> { jobId?: string; startedAt: number }
    const [activeSyncingAccounts, setActiveSyncingAccounts] = useState<
        Record<string, { jobId?: string; startedAt: number }>
    >(() => {
        const initial: Record<string, { jobId?: string; startedAt: number }> = {};
        for (const acc of initialAccounts) {
            if (
                acc.latestJob &&
                (acc.latestJob.status === "PENDING" ||
                    acc.latestJob.status === "PROCESSING")
            ) {
                const created = new Date(acc.latestJob.createdAt).getTime();
                const maxAge = acc.latestJob.status === "PENDING" ? 60000 : 120000;
                if (Date.now() - created < maxAge) {
                    initial[acc.id] = {
                        jobId: acc.latestJob.id,
                        startedAt: created,
                    };
                }
            }
        }
        return initial;
    });

    const handleSyncStarted = (accountId: string, jobId?: string) => {
        setActiveSyncingAccounts((prev) => ({
            ...prev,
            [accountId]: { jobId, startedAt: Date.now() },
        }));
    };

    // Polling active background sync jobs every 3 seconds
    useEffect(() => {
        const accountIds = Object.keys(activeSyncingAccounts);
        if (accountIds.length === 0) return;

        const interval = setInterval(async () => {
            for (const accountId of accountIds) {
                const syncInfo = activeSyncingAccounts[accountId];
                if (!syncInfo) continue;

                const targetAccount = initialAccounts.find(
                    (a) => a.id === accountId
                );
                const accLabel = targetAccount?.accountNumber
                    ? `#${targetAccount.accountNumber}`
                    : targetAccount?.name || "Account";

                // Hard safety net: 90 seconds timeout
                if (Date.now() - syncInfo.startedAt > 90000) {
                    toast.error(`Cloud Sync Timed Out: ${accLabel}`, {
                        description:
                            "The cloud worker did not complete the sync in time. Please verify credentials or request Sync Support.",
                        action: {
                            label: "Sync Support",
                            onClick: () => {
                                setSupportDrawerAccountId(accountId);
                                setSupportDrawerTab("create");
                                setSupportDrawerOpen(true);
                            },
                        },
                        duration: 8000,
                    });

                    // Proactively mark job failed in background
                    cancelCloudSyncJob(accountId, "Cloud sync timed out after 90s with no worker response.").catch(() => { });

                    setActiveSyncingAccounts((prev) => {
                        const next = { ...prev };
                        delete next[accountId];
                        return next;
                    });

                    startTransition(() => {
                        router.refresh();
                    });
                    continue;
                }

                try {
                    const res = await getCloudSyncStatus(accountId);
                    if (!res.success || !res.latestJob) continue;

                    if (res.latestJob.status === "COMPLETED") {
                        toast.success(
                            `Cloud Sync Completed: ${accLabel} synced successfully!`,
                            {
                                description:
                                    res.latestJob.message ||
                                    `Imported ${res.latestJob.dealsReceived || 0} deals.`,
                            }
                        );
                        setActiveSyncingAccounts((prev) => {
                            const next = { ...prev };
                            delete next[accountId];
                            return next;
                        });
                        startTransition(() => {
                            router.refresh();
                        });
                    } else if (res.latestJob.status === "FAILED") {
                        const isTimeout = res.latestJob.errorCode === "JOB_TIMEOUT";
                        toast.error(
                            isTimeout
                                ? `Cloud Sync Timed Out: ${accLabel}`
                                : `Cloud Sync Failed: ${accLabel}`,
                            {
                                description:
                                    res.latestJob.errorMessage ||
                                    res.latestJob.message ||
                                    "Failed to sync trade history.",
                                action: {
                                    label: "Sync Support",
                                    onClick: () => {
                                        setSupportDrawerAccountId(accountId);
                                        setSupportDrawerTab("create");
                                        setSupportDrawerOpen(true);
                                    },
                                },
                                duration: 8000,
                            }
                        );
                        setActiveSyncingAccounts((prev) => {
                            const next = { ...prev };
                            delete next[accountId];
                            return next;
                        });
                        startTransition(() => {
                            router.refresh();
                        });
                    }
                } catch {
                    // Network error during poll, retry next interval
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeSyncingAccounts, initialAccounts, router]);

    // Consumes each query-param trigger exactly once. history.replaceState does
    // NOT refresh useSearchParams in the App Router, so without this guard the
    // stale ?setup=sync/?action=add param would re-fire this effect on every
    // activeModal change and re-open the modal the instant the user closes it.
    const handledParamsRef = useRef<string | null>(null);

    // Handle incoming query params (e.g. ?action=add&intent=unlock-pro or ?setup=sync&method=tnt)
    useEffect(() => {
        const action = searchParams.get("action");
        const intent = searchParams.get("intent");
        const setup = searchParams.get("setup");
        const method = searchParams.get("method");
        const health = searchParams.get("health");
        const isProIntent = intent === "unlock-pro";
        const isAddAction = action === "add";
        const isSyncSetup = setup === "sync";
        const isSyncHealth = health === "sync";

        // No trigger params left in the URL → reset so a future navigation to
        // the same ?setup=sync&method=ea URL can open the modal again.
        const hasTrigger =
            isSyncHealth || isSyncSetup || isAddAction || isProIntent;
        if (!hasTrigger) {
            handledParamsRef.current = null;
            return;
        }

        const paramsKey = searchParams.toString();
        if (handledParamsRef.current === paramsKey) return;

        if (isSyncHealth && activeModal.type === "NONE") {
            handledParamsRef.current = paramsKey;
            if (isSyncHealthCenterEnabled()) {
                setActiveModal({ type: "SYNC_HEALTH" });
            }

            // Clean query params
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("health");
            const newUrl = newParams.toString()
                ? `?${newParams.toString()}`
                : window.location.pathname;
            router.replace(newUrl, { scroll: false });
            return;
        }

        if (isSyncSetup && activeModal.type === "NONE") {
            handledParamsRef.current = paramsKey;
            // Auto-open sync wizard with method from query, then saved onboarding preference.
            const syncMethod = getSyncMethodFromQuery(
                method,
                preferredSyncMethod
            );
            setDefaultSyncMethod(syncMethod);
            setActiveModal({ type: "SYNC_SETUP" });

            // Clean query params
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("setup");
            newParams.delete("method");
            const newUrl = newParams.toString()
                ? `?${newParams.toString()}`
                : window.location.pathname;
            router.replace(newUrl, { scroll: false });
            return;
        }

        if ((isAddAction || isProIntent) && activeModal.type === "NONE") {
            handledParamsRef.current = paramsKey;
            if (isAddAction && !isProIntent && isFreeLimitReached) {
                toast.info(
                    "Free tier is limited to 3 connected accounts. Upgrade to Partner Pro for unlimited accounts."
                );
                setActiveModal({ type: "FREE_VS_PRO" });
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete("action");
                const newUrl = newParams.toString()
                    ? `?${newParams.toString()}`
                    : window.location.pathname;
                router.replace(newUrl, { scroll: false });
                return;
            }
            const sourceAccountId = searchParams.get("sourceAccountId");
            let initialMode: "chooser" | "pro" | "upgrade-pro" = isProIntent
                ? "pro"
                : "chooser";
            let sourceAccount: TradingAccount | undefined;

            if (sourceAccountId) {
                sourceAccount = initialAccounts.find(
                    (a) => a.id === sourceAccountId
                );
            }
            // Fall back to the main account when the source account isn't on
            // this page (e.g. navigated from another page, or paginated
            // off-page). Without this the user dead-ends in the generic pro
            // flow instead of the prefilled upgrade form.
            if (!sourceAccount && isProIntent && initialAccounts.length > 0) {
                sourceAccount =
                    initialAccounts.find((a) => a.id === mainAccountId) ||
                    initialAccounts[0];
            }
            if (sourceAccount) {
                initialMode = "upgrade-pro";
            }

            setActiveModal({ type: "ADD", initialMode, sourceAccount });

            // Clear the query params after handling them
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("action");
            newParams.delete("intent");
            newParams.delete("sourceAccountId");
            const newUrl = newParams.toString()
                ? `?${newParams.toString()}`
                : window.location.pathname;
            router.replace(newUrl, { scroll: false });
        }
    }, [
        searchParams,
        activeModal.type,
        mainAccountId,
        initialAccounts,
        preferredSyncMethod,
        router,
    ]);

    // Calculate summary stats
    const totalBalance = initialAccounts.reduce(
        (sum, acc) => sum + (acc.balance || 0),
        0
    );
    const totalConnected = initialAccounts.length;

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined) return "$0.00";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <PageHeader
                title="Account Hub"
                description="Connect and manage MT5 accounts."
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={() => {
                            startTransition(() => {
                                router.refresh();
                            });
                        }}
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] flex-1 sm:flex-none shadow-sm"
                    >
                        <RefreshCw
                            size={14}
                            className={
                                isPending ? "animate-spin text-primary" : "text-gray-400 dark:text-gray-500"
                            }
                        />
                        Refresh
                    </Button>
                    <Button
                        id="onborda-trade-sync-setup"
                        variant="outline"
                        size="smd"
                        onClick={() => setActiveModal({ type: "SYNC_SETUP" })}
                        className="flex items-center justify-center gap-2 border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] flex-1 sm:flex-none shadow-sm"
                    >
                        <Cable size={14} className="text-cyan-500" />
                        Set up Trade Sync
                    </Button>
                    {isSyncHealthCenterEnabled() && (
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={() =>
                                setActiveModal({ type: "SYNC_HEALTH" })
                            }
                            className="flex items-center justify-center gap-2 border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] flex-1 sm:flex-none shadow-sm"
                        >
                            <Activity size={14} className="text-amber-500" />
                            Sync Health Center
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={() => setActiveModal({ type: "FREE_VS_PRO" })}
                        className="flex items-center justify-center gap-2 border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] flex-1 sm:flex-none shadow-sm"
                    >
                        <Crown size={14} className="text-amber-500" />
                        Free vs Pro
                    </Button>
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={() => {
                            setSupportDrawerAccountId(null);
                            setSupportDrawerTab(userTickets.length > 0 ? "list" : "create");
                            setSupportDrawerOpen(true);
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] flex-1 sm:flex-none shadow-sm font-semibold transition-all",
                            pendingSupportCount > 0 && "border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300"
                        )}
                    >
                        <LifeBuoy size={14} className={cn("text-amber-500", pendingSupportCount > 0 && "animate-pulse")} />
                        <span>Sync Support</span>
                        {pendingSupportCount > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none">
                                {pendingSupportCount}
                            </span>
                        )}
                    </Button>
                    <Button
                        id="onborda-add-account"
                        variant="primary"
                        size="smd"
                        onClick={() => {
                            if (isFreeLimitReached) {
                                toast.info(
                                    "Free tier is limited to 3 connected accounts. Upgrade to Partner Pro for unlimited accounts."
                                );
                                setActiveModal({ type: "FREE_VS_PRO" });
                                return;
                            }
                            setActiveModal({ type: "ADD" });
                        }}
                        className="flex items-center justify-center gap-2 shadow-lg shadow-primary/25 flex-1 sm:flex-none font-bold"
                    >
                        <Plus size={16} />
                        Add Account
                    </Button>
                </div>
            </PageHeader>

            {/* Account Grid */}
            {isPending && initialAccounts.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : initialAccounts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-2xl border-2 border-dashed border-dashboard mt-8 shadow-sm">
                    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto px-4">
                        <div className="w-16 h-16 mb-5 rounded-2xl bg-primary/10 dark:bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <Wallet size={30} strokeWidth={1.75} />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            No Trading Accounts Linked
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                            Connect your MT5 account to track execution telemetry and sync trade history, or apply for Partner Pro to enable EA downloads and advanced risk analytics.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    trackEvent(
                                        "first_session_add_account_clicked",
                                        { mode: "free" }
                                    );
                                    setActiveModal({
                                        type: "ADD",
                                        initialMode: "free",
                                    });
                                }}
                                className="min-w-[140px] border-dashboard bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.08] font-bold"
                            >
                                Free MT5 Sync
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    trackEvent(
                                        "first_session_add_account_clicked",
                                        { mode: "pro" }
                                    );
                                    setActiveModal({
                                        type: "ADD",
                                        initialMode: "pro",
                                    });
                                }}
                                className="shadow-lg min-w-[160px] bg-gradient-to-r from-amber-500 to-amber-600 border-none hover:from-amber-600 hover:to-amber-700 font-bold"
                            >
                                Apply for Partner Pro
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-5 w-full mt-6">
                    {/* Financial Telemetry Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] shadow-sm">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
                                Total Balance
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                                {formatCurrency(totalBalance)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                            {isPro ? (
                                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-xs shadow-sm">
                                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                                        {totalConnected} {totalConnected === 1 ? "Account" : "Accounts"}
                                    </span>
                                    <span className="text-gray-300 dark:text-white/20">·</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px]">
                                        Unlimited Pro
                                    </span>
                                </div>
                            ) : isFreeLimitReached ? (
                                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10 text-xs shadow-sm">
                                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                                        {totalConnected}/{MAX_FREE_ACCOUNTS} Accounts
                                    </span>
                                    <span className="text-amber-300 dark:text-amber-500/40">·</span>
                                    <span className="text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                                        Free Limit
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveModal({ type: "FREE_VS_PRO" })}
                                        className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                                    >
                                        Upgrade <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-dashboard/80 bg-gray-50/80 dark:bg-white/[0.03] dark:border-white/10 text-xs shadow-sm">
                                    <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                                        {totalConnected}/{MAX_FREE_ACCOUNTS} Accounts
                                    </span>
                                    <span className="text-gray-300 dark:text-white/20">·</span>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">
                                        Free Tier
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Professional Trading Table */}
                    <AccountTable
                        accounts={initialAccounts}
                        mainAccountId={mainAccountId}
                        onSetMain={async (id) => {
                            setMainAccountId(id); // optimistic
                            const result = await setMainAccount(id);
                            if (result.error) {
                                setMainAccountId(mainAccountId); // rollback
                                toast.error(result.error);
                            } else {
                                toast.success("Main account updated");
                                document.cookie = `last_account_id=${id};path=/;max-age=31536000;samesite=lax`;
                                proAccess.refetch();
                            }
                        }}
                        onUpdate={() => {
                            startTransition(() => {
                                router.refresh();
                            });
                        }}
                        onDelete={(id) =>
                            setActiveModal({
                                type: "DELETE",
                                accountId: id,
                            })
                        }
                        onSettings={(acc) =>
                            setActiveModal({
                                type: "SETTINGS",
                                account: acc,
                            })
                        }
                        onUnlockPro={(acc) =>
                            setActiveModal({
                                type: "ADD",
                                initialMode: "upgrade-pro",
                                sourceAccount: acc,
                            })
                        }
                        preferredSyncMethod={preferredSyncMethod}
                        activeSyncingAccounts={activeSyncingAccounts}
                        onSyncStarted={handleSyncStarted}
                        onRequestSupport={(id) => {
                            setSupportDrawerAccountId(id);
                            setSupportDrawerTab("create");
                            setSupportDrawerOpen(true);
                        }}
                        userTickets={userTickets}
                        onOpenSyncSetup={(method) => {
                            setDefaultSyncMethod(method);
                            setActiveModal({
                                type: "SYNC_SETUP",
                            });
                        }}
                    />

                    {/* Pagination */}
                    {meta && (
                        <div className="mt-6">
                            <PaginationControl
                                currentPage={meta.page}
                                totalPages={meta.totalPages}
                                pageSize={meta.limit}
                                totalItems={meta.total}
                                onPageChange={(p) =>
                                    router.push(
                                        `/dashboard/accounts?page=${p}&limit=${meta.limit}`
                                    )
                                }
                                onPageSizeChange={(l) =>
                                    router.push(
                                        `/dashboard/accounts?page=1&limit=${l}`
                                    )
                                }
                                itemName="accounts"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Settings Modal */}
            <AnimatePresence>
                {activeModal.type === "SETTINGS" && (
                    <AccountSettingsModal
                        isOpen={true}
                        account={activeModal.account}
                        onClose={() => setActiveModal({ type: "NONE" })}
                        onUpdate={() => router.refresh()}
                        onDelete={() => {
                            setActiveModal({
                                type: "DELETE",
                                accountId: activeModal.account.id,
                            });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AddAccountModal
                isOpen={activeModal.type === "ADD"}
                onClose={() => {
                    setActiveModal({ type: "NONE" });
                    setWasInSyncSetup(false);
                }}
                onSuccess={(_account) => {
                    // Free accounts carry a "platform" field (pro accounts do
                    // not), letting us tell the two flows apart.
                    const isFreeAccount =
                        !!_account && "platform" in _account;
                    const hasCloudSync = Boolean(_account?.hasCloudSync);
                    // upgradeToPartnerPro always returns isNewAccount:false —
                    // the account already existed, so this was a Pro upgrade
                    // request, not a new account. "Account added" would be
                    // misleading there.
                    const isProUpgrade =
                        !!_account && _account.isNewAccount === false;

                    if (wasInSyncSetup) {
                        setWasInSyncSetup(false);
                        setActiveModal({ type: "SYNC_SETUP" });
                        toast.success(
                            "Account added successfully! Returning to Sync Wizard..."
                        );
                    } else if (isFreeAccount && hasCloudSync) {
                        // User activated Cloud Sync during account creation - no EA wizard needed
                        setActiveModal({ type: "NONE" });
                        toast.success(
                            "Account added and automated Cloud Sync queued!"
                        );
                    } else if (isFreeAccount && defaultSyncMethod !== "MANUAL") {
                        // Free account added from the chooser with an
                        // EA/Trade Manager method: the "Continue to Trade
                        // Manager Setup" CTA promises to continue, so open the
                        // sync wizard instead of dead-ending.
                        setActiveModal({ type: "SYNC_SETUP" });
                        toast.success(
                            "Account added successfully! Continue with Trade Manager setup..."
                        );
                    } else if (isProUpgrade) {
                        setActiveModal({ type: "NONE" });
                        toast.success(
                            "Pro upgrade request submitted! Our team will review your application."
                        );
                    } else {
                        setActiveModal({ type: "NONE" });
                        toast.success("Account added successfully!");
                    }
                    router.refresh();
                }}
                initialMode={
                    activeModal.type === "ADD"
                        ? activeModal.initialMode
                        : undefined
                }
                sourceAccount={
                    activeModal.type === "ADD"
                        ? activeModal.sourceAccount
                        : undefined
                }
                userEmail={userEmail}
                userName={userName}
                userTelegramId={userTelegramId}
                userCountry={userCountry}
                setupSyncMethod={
                    wasInSyncSetup ? defaultSyncMethod : preferredSyncMethod
                }
            />

            {/* Regenerate Key Modal */}
            <RegenerateKeyModal
                isOpen={activeModal.type === "REGEN"}
                onClose={() => setActiveModal({ type: "NONE" })}
                accountId={
                    activeModal.type === "REGEN" ? activeModal.accountId : null
                }
            />

            {/* Delete Confirmation Modal */}
            <DeleteAccountModal
                isOpen={activeModal.type === "DELETE"}
                onClose={() => setActiveModal({ type: "NONE" })}
                accountId={
                    activeModal.type === "DELETE" ? activeModal.accountId : null
                }
                onSuccess={() => router.refresh()}
            />

            {/* Trade Sync Setup Wizard */}
            <TradeSyncWizard
                isOpen={activeModal.type === "SYNC_SETUP"}
                onClose={() => {
                    setActiveModal({ type: "NONE" });
                    setDefaultSyncMethod(undefined);
                }}
                accounts={initialAccounts}
                defaultMethod={defaultSyncMethod}
                onOpenAddAccount={(method) => {
                    if (isFreeLimitReached) {
                        toast.info(
                            "Free tier is limited to 3 connected accounts. Upgrade to Partner Pro for unlimited accounts."
                        );
                        setActiveModal({ type: "FREE_VS_PRO" });
                        return;
                    }
                    setWasInSyncSetup(true);
                    setDefaultSyncMethod(method);
                    setActiveModal({ type: "ADD", initialMode: "free" });
                }}
            />

            {/* Free vs Pro Modal */}
            <Dialog
                open={activeModal.type === "FREE_VS_PRO"}
                onOpenChange={(open) =>
                    !open && setActiveModal({ type: "NONE" })
                }
            >
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-[#1E2028] border-dashboard dark:border-white/[0.08]">
                    <div className="p-6 pb-4 border-b border-dashboard dark:border-white/[0.08]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Crown className="w-6 h-6 text-amber-500" />
                                Free vs Pro Access
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Free accounts can track and sync trades. Partner
                                Pro enables premium downloads, VIP access, and
                                advanced trading intelligence for eligible
                                accounts.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="max-h-[70vh] overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/[0.04] sticky top-0 border-b border-dashboard dark:border-white/[0.08]">
                                <tr>
                                    <th className="w-1/2 px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        Feature
                                    </th>
                                    <th className="w-1/4 px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                        Free
                                    </th>
                                    <th className="w-1/4 px-6 py-4 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap bg-amber-500/[0.04] dark:bg-amber-500/[0.08]">
                                        <div className="flex items-center gap-1.5">
                                            <Crown className="w-4 h-4 text-amber-500" />
                                            <span>Partner Pro</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dashboard dark:divide-white/[0.06]">
                                {[
                                    {
                                        name: "Connected MT5 accounts",
                                        free: "Up to 3 accounts",
                                        pro: "Unlimited",
                                    },
                                    {
                                        name: "Account tracking",
                                        free: "Included",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Trade sync",
                                        free: "Included",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Trade Manager EA download",
                                        free: "Included",
                                        pro: "Included",
                                    },
                                    {
                                        name: "EA downloads",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Indicator downloads",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Discipline Radar / Risk Assessment",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Edge Leak Detector",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Rule Violation Tracker",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "VIP community & priority support",
                                        free: "Locked",
                                        pro: "Included",
                                    },
                                    {
                                        name: "Partner Pro eligibility review",
                                        free: "Eligibility review",
                                        pro: "Verified",
                                    },
                                ].map((row, i) => (
                                    <tr
                                        key={i}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="w-1/2 px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                            {row.name}
                                        </td>
                                        <td className="w-1/4 px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                {row.free === "Up to 3 accounts" && (
                                                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                                )}
                                                {row.free === "Included" && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                )}
                                                {row.free === "Locked" && (
                                                    <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                                                )}
                                                {row.free ===
                                                    "Eligibility review" && (
                                                        <Clock3 className="w-4 h-4 text-amber-500 shrink-0" />
                                                    )}
                                                <span
                                                    className={
                                                        row.free === "Included"
                                                            ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                                            : row.free ===
                                                                "Locked"
                                                                ? "text-gray-500 font-medium"
                                                                : row.free ===
                                                                    "Up to 3 accounts"
                                                                    ? "text-gray-900 dark:text-gray-200 font-semibold"
                                                                    : "text-amber-700 dark:text-amber-400 font-medium"
                                                    }
                                                >
                                                    {row.free}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="w-1/4 px-6 py-4 whitespace-nowrap bg-amber-500/[0.02] dark:bg-amber-500/[0.04]">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                {row.pro === "Included" && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                )}
                                                {(row.pro === "Verified" ||
                                                    row.pro === "Unlimited") && (
                                                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                                    )}
                                                <span
                                                    className={
                                                        row.pro === "Verified" ||
                                                            row.pro === "Unlimited"
                                                            ? "text-amber-600 dark:text-amber-400 font-bold"
                                                            : "text-emerald-700 dark:text-emerald-400 font-medium"
                                                    }
                                                >
                                                    {row.pro}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-500 dark:text-gray-400 border-t border-dashboard dark:border-white/[0.08]">
                        <p>
                            Partner Pro access depends on supported broker and
                            account eligibility. If an account is not eligible,
                            the request may be rejected after review.
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span>Supported Brokers:</span>
                            <div className="flex items-center flex-wrap gap-2">
                                <a
                                    href="https://www.vantagemarkets.com/forex-trading/forex-trading-account/?affid=111451"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors"
                                >
                                    Vantage
                                </a>
                                <span className="text-gray-300 dark:text-gray-600">
                                    •
                                </span>
                                <a
                                    href="https://one.exnessonelink.com/a/1ewjh1ww32"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors"
                                >
                                    Exness
                                </a>
                                <span className="text-gray-300 dark:text-gray-600">
                                    •
                                </span>
                                <a
                                    href="https://www.vtmarkets.com/get-trading/forex-trading-account/?affid=830422"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors"
                                >
                                    VTMarkets
                                </a>
                                <span className="text-gray-300 dark:text-gray-600">
                                    •
                                </span>
                                <a
                                    href="https://www.ultimamarkets.trade/forex-trading/forex-trading-account/?affid=NzIzNDkwMw=="
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors"
                                >
                                    Ultima Markets
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 px-6 bg-gray-50 dark:bg-white/[0.01] border-t border-dashboard dark:border-white/[0.08] flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setActiveModal({ type: "NONE" })}
                            className="rounded-xl font-bold h-11 px-5"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setActiveModal({ type: "NONE" });
                                router.push(
                                    "/dashboard/accounts?action=add&intent=unlock-pro"
                                );
                            }}
                            className="rounded-xl font-bold h-11 px-6 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center gap-2"
                        >
                            Unlock Partner Pro <ArrowRight size={14} />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sync Health Center Modal */}
            <SyncHealthCenter
                isOpen={activeModal.type === "SYNC_HEALTH"}
                onOpenChange={(open) =>
                    !open && setActiveModal({ type: "NONE" })
                }
                onActionTrigger={(action) => {
                    if (
                        action === "open_sync_setup" ||
                        action === "reconnect"
                    ) {
                        setActiveModal({ type: "SYNC_SETUP" });
                    } else if (action === "sync_first_trades") {
                        setActiveModal({ type: "SYNC_SETUP" });
                    }
                }}
            />

            {/* Sync Support Slide-over Drawer */}
            <SyncSupportDrawer
                isOpen={supportDrawerOpen}
                onClose={() => setSupportDrawerOpen(false)}
                accounts={initialAccounts}
                tickets={userTickets}
                onRefreshTickets={loadUserTickets}
                initialAccountId={supportDrawerAccountId}
                defaultTab={supportDrawerTab}
            />
        </div>
    );
}
