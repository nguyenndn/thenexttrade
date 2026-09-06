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
} from "lucide-react";
import { SyncHealthCenter } from "./SyncHealthCenter";
import { AccountCard } from "./AccountCard";
import { AddAccountModal } from "./AddAccountModal";
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
    const totalEquity = initialAccounts.reduce(
        (sum, acc) => sum + (acc.equity || 0),
        0
    );
    const totalConnected = initialAccounts.length;
    const activeSyncs = initialAccounts.filter(
        (acc) => acc.isConnected && acc.status === "ACTIVE"
    ).length;

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
                description="Connect and manage MT5 accounts, sync trades, and unlock Pro benefits."
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
                        id="onborda-add-account"
                        variant="primary"
                        size="smd"
                        onClick={() => setActiveModal({ type: "ADD" })}
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
                            Connect your MT5 account to track execution telemetry and sync trade history, or apply for Partner Pro to unlock EA downloads and advanced risk analytics.
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
                <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch mt-6">
                    {/* Left Column: Accounts and summary stats (72%) */}
                    <div className="flex-1 lg:max-w-[72%] space-y-6">
                        {/* KPI Stats Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Card 1: Total Balance */}
                            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-2xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider block">
                                        Total Balance
                                    </span>
                                    <span className="text-lg font-black text-gray-900 dark:text-white block truncate">
                                        {formatCurrency(totalBalance)}
                                    </span>
                                </div>
                            </div>

                            {/* Card 2: Total Equity */}
                            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-2xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider block">
                                        Total Equity
                                    </span>
                                    <span className="text-lg font-black text-gray-900 dark:text-white block truncate">
                                        {formatCurrency(totalEquity)}
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Active Synchronization */}
                            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-2xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                    <Cable className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider block">
                                        Sync Status
                                    </span>
                                    <span className="text-lg font-black text-gray-900 dark:text-white block truncate">
                                        {activeSyncs} / {totalConnected}{" "}
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account Grid */}
                        <div
                            id="onborda-account-grid"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
                        >
                            {initialAccounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="min-w-0 h-full"
                                >
                                    <AccountCard
                                        account={account}
                                        isMain={account.id === mainAccountId}
                                        onSetMain={async (id) => {
                                            setMainAccountId(id); // optimistic
                                            const result =
                                                await setMainAccount(id);
                                            if (result.error) {
                                                setMainAccountId(mainAccountId); // rollback
                                                toast.error(result.error);
                                            } else {
                                                toast.success(
                                                    "Main account updated"
                                                );
                                                // Update cookie so next nav link uses new main account
                                                document.cookie = `last_account_id=${id};path=/;max-age=31536000;samesite=lax`;
                                                // Immediately refresh sidebar Pro badge
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
                                        preferredSyncMethod={
                                            preferredSyncMethod
                                        }
                                        onOpenSyncSetup={(method) => {
                                            setDefaultSyncMethod(method);
                                            setActiveModal({
                                                type: "SYNC_SETUP",
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && (
                            <div className="mt-8">
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

                    {/* Right Column: Connection Guide & Pro Status Sidebar (28%) */}
                    <div className="w-full lg:w-[28%] shrink-0 space-y-6 flex flex-col justify-start">
                        {/* Card 1: Connection Guide */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-dashboard dark:border-gray-800">
                                <Cable className="w-5 h-5 text-cyan-500" />
                                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                    Connection Guide
                                </h4>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Synchronize your MT5 accounts using our unified
                                MT5 trade management overlay:
                            </p>
                            <div className="space-y-3">
                                <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 space-y-2">
                                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block">
                                        Trade Manager (Expert Advisor)
                                    </span>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal block">
                                        Our unified MT5 overlay. Handles
                                        execution, trend matrix, and real-time
                                        trade synchronization directly from your
                                        MT5 terminal.
                                    </span>
                                    <div className="pt-1 flex flex-col gap-2">
                                        <Link
                                            href="/trading-systems/trade-manager"
                                            className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            View Trade Manager Details &rarr;
                                        </Link>
                                        <a
                                            href="/downloads/TheNextTrade_TradeSync.ex5"
                                            download
                                            className="text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:underline inline-flex items-center gap-1"
                                        >
                                            Download Trade Manager EA (.ex5)
                                            &rarr;
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Partner Pro Access */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-dashboard dark:border-gray-800">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                    Partner Pro Access
                                </h4>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Open an account with our supported brokers to
                                unlock EA downloads, VIP tools, and premium
                                features:
                            </p>
                            <div className="space-y-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                    <span>EA downloads</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        Included
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                    <span>Discipline Coach & Telemetry</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        Included
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                    <span>Edge Leak Detector</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        Included
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() =>
                                    setActiveModal({ type: "FREE_VS_PRO" })
                                }
                                variant="outline"
                                className="w-full h-9 rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                            >
                                Compare Plans & Benefits
                            </Button>
                        </div>
                    </div>
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
                                Pro unlocks premium downloads, VIP access, and
                                advanced trading intelligence for eligible
                                accounts.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[640px] text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/[0.04] sticky top-0 border-b border-dashboard dark:border-white/[0.08]">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        Feature
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        Free
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        Pro
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        URL
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dashboard dark:divide-white/[0.06]">
                                {[
                                    {
                                        name: "Account tracking",
                                        free: "Included",
                                        pro: "Included",
                                        url: "/dashboard/accounts",
                                        label: "/dashboard/accounts",
                                    },
                                    {
                                        name: "Trade sync",
                                        free: "Included",
                                        pro: "Included",
                                        url: "/dashboard/accounts",
                                        label: "/dashboard/accounts",
                                    },
                                    {
                                        name: "Trade Manager EA download",
                                        free: "Included",
                                        pro: "Included",
                                        url: "/trading-systems/trade-manager",
                                        label: "Trade Manager Page",
                                    },
                                    {
                                        name: "EA downloads",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/trading-systems",
                                        label: "/dashboard/trading-systems",
                                    },
                                    {
                                        name: "Indicator downloads",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/trading-systems",
                                        label: "/dashboard/trading-systems",
                                    },
                                    {
                                        name: "Discipline Radar / Risk Assessment",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/intelligence",
                                        label: "/dashboard/intelligence",
                                    },
                                    {
                                        name: "Edge Leak Detector",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/intelligence",
                                        label: "/dashboard/intelligence",
                                    },
                                    {
                                        name: "Rule Violation Tracker",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/intelligence",
                                        label: "/dashboard/intelligence",
                                    },
                                    {
                                        name: "VIP community & priority support",
                                        free: "Locked",
                                        pro: "Included",
                                        url: "/dashboard/trading-systems?tab=VIP",
                                        label: "/dashboard/trading-systems?tab=VIP",
                                    },
                                    {
                                        name: "Partner Pro eligibility review",
                                        free: "Eligibility review",
                                        pro: "Verified",
                                        url: "/dashboard/accounts?action=add&intent=unlock-pro",
                                        label: "/dashboard/accounts?action=add&intent=unlock-pro",
                                    },
                                ].map((row, i) => (
                                    <tr
                                        key={i}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                            {row.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {row.free === "Included" && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                )}
                                                {row.free === "Locked" && (
                                                    <Lock className="w-4 h-4 text-gray-400" />
                                                )}
                                                {row.free ===
                                                    "Eligibility review" && (
                                                    <Clock3 className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span
                                                    className={
                                                        row.free === "Included"
                                                            ? "text-emerald-700 dark:text-emerald-400"
                                                            : row.free ===
                                                                "Locked"
                                                              ? "text-gray-500"
                                                              : "text-amber-700 dark:text-amber-400"
                                                    }
                                                >
                                                    {row.free}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {row.pro === "Included" && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                )}
                                                {row.pro === "Verified" && (
                                                    <Crown className="w-4 h-4 text-emerald-500" />
                                                )}
                                                <span className="text-emerald-700 dark:text-emerald-400">
                                                    {row.pro}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.url.startsWith(
                                                "/downloads"
                                            ) ? (
                                                <a
                                                    href={row.url}
                                                    download
                                                    className="text-primary hover:underline"
                                                >
                                                    {row.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={row.url}
                                                    onClick={() =>
                                                        setActiveModal({
                                                            type: "NONE",
                                                        })
                                                    }
                                                    className="text-primary hover:underline"
                                                >
                                                    {row.label}
                                                </Link>
                                            )}
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
        </div>
    );
}
