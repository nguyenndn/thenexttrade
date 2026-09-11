"use client";

import { useState } from "react";
import {
    MoreVertical,
    Settings,
    Trash2,
    ExternalLink,
    Trophy,
    Crown,
    Star,
    Cable,
    Monitor,
    ArrowRight,
    Zap,
    PenLine,
    Info,
    RefreshCw,
    X,
} from "lucide-react";
import { cancelCloudSyncJob } from "@/actions/cloud-sync";
import Link from "next/link";
import { CloudSyncModal } from "./CloudSyncModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";
import { cn } from "@/lib/utils";
import type { SyncMethod } from "@/lib/onboarding/first-session.server";
import { normalizeSyncSource, formatSyncErrorMessage } from "@/lib/sync/sync-source";

// Compute the sync method label for each account.
// Uses syncSource as the primary source of truth (set by the API on each sync).
// lastHeartbeat is shared by both EA and the retired sync client (previously "TNT Connect"), so it's not reliable for differentiation.
function getSyncMethodLabel(account: any): {
    label: string;
    variant: "ea" | "paused" | "none";
} {
    if (account.autoSync === false)
        return { label: "Sync paused", variant: "paused" };

    const source = normalizeSyncSource(account.syncSource);

    // Primary: use the explicit sync source field
    if (source === "EA_SYNC" || source === "APP" || source === "WINDOWS_IMPORT")
        return { label: "Synced via Trade Manager", variant: "ea" };
    if (account.syncSource === "CLOUD_WORKER")
        return { label: "Cloud Sync", variant: "ea" };
    if (source === "MANUAL")
        return { label: "Manual Entry", variant: "paused" };

    // Fallback: infer from presence of EA version or heartbeat / sync timestamps
    if (account.eaVersion || account.appLastHeartbeat || account.lastHeartbeat || account.lastSync)
        return { label: "Synced via Trade Manager", variant: "ea" };

    // No sync data at all
    return { label: "Not connected", variant: "none" };
}

interface AccountCardProps {
    account: any;
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onSettings: (account: any) => void;
    onUnlockPro?: (account: any) => void;
    isMain?: boolean;
    onSetMain?: (accountId: string) => void;
    preferredSyncMethod?: SyncMethod;
    onOpenSyncSetup?: (method?: SyncMethod) => void;
    isSyncing?: boolean;
    onSyncStarted?: (accountId: string, jobId?: string) => void;
    onRequestSupport?: (accountId: string) => void;
}

// Returns account type label, or null if not yet synced
const getAccountType = (
    type: string | null | undefined,
    server?: string | null
): string | null => {
    if (!type) return null; // Not synced yet — no badge
    const t = type.toUpperCase();
    if (t === "PERSONAL") {
        // Double-check against server name for demo detection
        if (server?.toLowerCase().includes("demo")) return "DEMO";
        return "REAL";
    }
    if (t === "DEMO" || t === "CONTEST") return "DEMO";
    return t;
};

const PRO_STATUS_CONFIG: Record<string, { label: string; className: string }> =
    {
        ACTIVE: {
            label: "Pro",
            className:
                "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        },
        GRACE: {
            label: "Grace",
            className:
                "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        },
        EXPIRED: {
            label: "Expired",
            className:
                "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        },
        REVOKED: {
            label: "Revoked",
            className:
                "bg-red-50 text-red-500 border-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        },
        NONE: {
            label: "Free",
            className:
                "bg-gray-50 text-gray-500 border-dashboard/80 dark:bg-white/5 dark:text-gray-400 ",
        },
    };

const ELIGIBILITY_CHIP: Record<
    string,
    { label: string; className: string; icon?: "crown" | "info" }
> = {
    PRO_ACTIVE: {
        label: "Pro",
        className:
            "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        icon: "crown",
    },
    PENDING_REVIEW: {
        label: "Under Review",
        className:
            "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        icon: "crown",
    },
    REJECTED: {
        label: "Not Approved",
        className:
            "bg-red-50 text-red-500 border-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        icon: "info",
    },
    ELIGIBLE: {
        label: "Eligible",
        className:
            "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        icon: "crown",
    },
    UNSUPPORTED_BROKER: {
        label: "Not Supported",
        className:
            "bg-gray-50 text-gray-500 border-dashboard/80 dark:bg-white/5 dark:text-gray-400",
        icon: "info",
    },
    MISSING_ACCOUNT_INFO: {
        label: "Missing Info",
        className:
            "bg-gray-50 text-gray-500 border-dashboard/80 dark:bg-white/5 dark:text-gray-400",
        icon: "info",
    },
};

export function AccountCard({
    account,
    onUpdate,
    onDelete,
    onSettings,
    onUnlockPro,
    isMain = false,
    onSetMain,
    preferredSyncMethod,
    onOpenSyncSetup,
    isSyncing: propIsSyncing,
    onSyncStarted,
    onRequestSupport,
}: AccountCardProps) {
    const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
    const isSyncing = Boolean(
        propIsSyncing ||
        (account.latestJob &&
            (account.latestJob.status === "PENDING" ||
                account.latestJob.status === "PROCESSING") &&
            Date.now() - new Date(account.latestJob.createdAt).getTime() <
                (account.latestJob.status === "PENDING" ? 60000 : 120000))
    );

    const latestJob = account.latestJob;
    const isLatestSyncFailed = Boolean(
        !isSyncing &&
        latestJob &&
        latestJob.status === "FAILED" &&
        (!account.lastSync ||
            new Date(latestJob.createdAt).getTime() > new Date(account.lastSync).getTime() ||
            (latestJob.completedAt && new Date(latestJob.completedAt).getTime() > new Date(account.lastSync).getTime()))
    );

    // Only trust accountType if account has actually synced at least once
    const hasSynced = !!account.lastSync;
    const accountType = hasSynced
        ? getAccountType(account.accountType, account.server)
        : null;
    const isReal = accountType === "REAL";

    // Sanitize accentColor: Purge purple/pink/fuchsia/violet from trading account cards to adhere to Breek brand palette
    const rawColor = (account.color || "").toLowerCase();
    const isDisallowedColor =
        rawColor.includes("purple") ||
        rawColor.includes("violet") ||
        rawColor.includes("pink") ||
        rawColor.includes("fuchsia") ||
        rawColor.includes("magenta") ||
        rawColor.includes("#a855f7") ||
        rawColor.includes("#8b5cf6") ||
        rawColor.includes("#ec4899") ||
        rawColor.includes("#d946ef") ||
        rawColor.includes("#c084fc");

    const accentColor =
        isDisallowedColor || !account.color
            ? isReal
                ? "#f59e0b"
                : "#64748b"
            : account.color;

    const syncMethod = getSyncMethodLabel(account);
    const hasTradeData = (account.totalTrades ?? 0) > 0;
    const isUnderReview =
        account.vipStatus === "PENDING" ||
        account.eligibility?.status === "PENDING_REVIEW" ||
        account.eligibility?.status === "PENDING";
    const shouldShowFirstSyncCta = !hasTradeData && !!onOpenSyncSetup && !isUnderReview;

    // Pro upgrade CTA — rendered in BOTH the first-sync branch (a zero-trade
    // eligible account can still request Partner Pro; hiding it forces users
    // to sync trades before they can convert) and the normal branch.
    function renderUnlockProButton() {
        const elig = account.eligibility;
        if (!elig) {
            if (
                (!account.proStatus || account.proStatus === "NONE") &&
                account.vipStatus !== "PENDING" &&
                onUnlockPro
            ) {
                return (
                    <Button
                        onClick={() => onUnlockPro(account)}
                        className="flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:text-white border-0"
                        title="Apply for Pro"
                        aria-label="Activate Pro tier"
                    >
                        <Crown size={11} />
                        <span>Activate Pro</span>
                    </Button>
                );
            }
            return null;
        }
        if (elig.canRequest && onUnlockPro) {
            return (
                <Button
                    onClick={() => onUnlockPro(account)}
                    className="flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:text-white border-0"
                    title={elig.status === "REJECTED" ? "Re-apply for Pro" : "Apply for Pro"}
                    aria-label={elig.status === "REJECTED" ? "Re-apply for Pro access" : "Activate Pro tier"}
                >
                    <Crown size={11} />
                    <span>{elig.status === "REJECTED" ? "Re-apply" : "Activate Pro"}</span>
                </Button>
            );
        }
        return null;
    }

    return (
        <div className="group relative flex flex-col rounded-2xl transition-all duration-500 hover:shadow-lg bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15">
            {/* Left accent border */}
            <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity z-10"
                style={{ backgroundColor: accentColor }}
            />

            {/* === Card Content === */}
            <div className="relative z-10 flex flex-col flex-1 px-5 pt-4 pb-3">
                {/* Top Row: Badges + Menu */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {accountType && (
                        <span
                            className={`text-[9px] font-black px-2 py-[3px] rounded-xl uppercase tracking-[0.1em] border whitespace-nowrap ${
                                isReal
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                    : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                            }`}
                        >
                            {accountType}
                        </span>
                    )}
                    {account.accountNumber && (
                        <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 tracking-wider whitespace-nowrap bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/15 px-2 py-[3px] rounded-xl tabular-nums">
                            #{account.accountNumber}
                        </span>
                    )}
                    {isSyncing ? (
                        <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-xl border whitespace-nowrap bg-amber-500/10 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 shadow-sm"
                            title="Sync in progress"
                        >
                            <RefreshCw size={9} className="animate-spin text-amber-500 shrink-0" />
                            Syncing...
                        </span>
                    ) : isLatestSyncFailed ? (
                        <button
                            type="button"
                            onClick={() => setIsCloudSyncOpen(true)}
                            className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-[3px] rounded-xl border whitespace-nowrap bg-rose-500/10 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 shadow-sm hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title={formatSyncErrorMessage(latestJob)}
                        >
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                            </span>
                            Sync Failed
                        </button>
                    ) : syncMethod.variant !== "none" ? (
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-xl border whitespace-nowrap",
                                syncMethod.variant === "ea"
                                    ? "bg-amber-500/10 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                                    : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-white/10 dark:text-gray-400 dark:border-white/15"
                            )}
                            title={syncMethod.label}
                        >
                            <Cable size={10} className="shrink-0" />
                            {syncMethod.variant === "ea" ? "EA Synced" : syncMethod.label}
                        </span>
                    ) : null}
                    {account.useForLeaderboard && (
                        <span
                            className="w-5 h-5 rounded-xl inline-flex items-center justify-center bg-yellow-100 border border-yellow-300 dark:bg-yellow-500/15 dark:border-yellow-500/30"
                            title="Leaderboard Account"
                        >
                            <Trophy
                                size={10}
                                className="text-yellow-600 dark:text-yellow-500"
                            />
                        </span>
                    )}
                    {isMain && (
                        <span
                            className="inline-flex items-center gap-1 px-1.5 py-[3px] rounded-xl text-[9px] font-black uppercase tracking-[0.1em] bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 text-yellow-600 dark:text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/5"
                            title="Main Account"
                        >
                            <Star
                                size={8}
                                className="fill-current text-amber-500 dark:text-amber-400"
                            />
                            Main
                        </span>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Account options"
                                className="w-7 h-7 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none shrink-0"
                            >
                                <MoreVertical size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-50 p-1.5 rounded-xl border-dashboard shadow-xl bg-white dark:bg-[#1E2028] z-[100]"
                        >
                            <DropdownMenuItem
                                onClick={() => onSettings(account)}
                                className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                            >
                                <Settings size={15} className="text-gray-500" />
                                <span>Account Settings</span>
                            </DropdownMenuItem>
                            {onSetMain && (
                                <DropdownMenuItem
                                    onClick={() => onSetMain(account.id)}
                                    disabled={isMain}
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Star
                                        size={15}
                                        className={
                                            isMain
                                                ? "text-amber-500 fill-current"
                                                : "text-gray-500"
                                        }
                                    />
                                    <span>
                                        {isMain
                                            ? "Main Account"
                                            : "Set as Main"}
                                    </span>
                                </DropdownMenuItem>
                            )}
                            {isSyncing && (
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            await cancelCloudSyncJob(account.id, "Sync stopped by user.");
                                            toast.info("Sync stopped.");
                                            onUpdate();
                                        } catch (err: any) {
                                            toast.error(err?.message || "Failed to stop sync.");
                                        }
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                >
                                    <X size={15} />
                                    <span>Cancel Sync</span>
                                </DropdownMenuItem>
                            )}
                            <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                            {isReal && (
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(
                                                `/api/trading-accounts/${account.id}/leaderboard`,
                                                { method: "POST" }
                                            );
                                            const data = await res.json();
                                            if (!res.ok)
                                                throw new Error(data.error);
                                            toast.success(
                                                data.useForLeaderboard
                                                    ? "Account set for leaderboard!"
                                                    : "Account removed from leaderboard"
                                            );
                                            onUpdate();
                                        } catch (e: any) {
                                            toast.error(
                                                e.message || "Failed to update"
                                            );
                                        }
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                                >
                                    <Trophy
                                        size={15}
                                        className={
                                            account.useForLeaderboard
                                                ? "text-yellow-500"
                                                : "text-gray-500"
                                        }
                                    />
                                    <span>
                                        {account.useForLeaderboard
                                            ? "Remove from Leaderboard"
                                            : "Use for Leaderboard"}
                                    </span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(account.id)}
                                className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors"
                            >
                                <Trash2 size={15} />
                                <span>Delete Account</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Account Name + Server (inline) */}
                <div className="flex items-baseline gap-2 min-w-0">
                    <h3
                        className="text-base font-bold text-gray-800 dark:text-white truncate leading-tight shrink-0"
                        title={account.name}
                    >
                        {account.name}
                    </h3>
                    <p
                        className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate"
                        title={account.server || "Server Unknown"}
                    >
                        {account.server || "Server Unknown"}
                    </p>
                </div>

                {/* Balance / Equity */}
                {(() => {
                    const balance = account.balance || 0;
                    const equity = account.equity ?? balance;
                    const floatingDiff = equity - balance;
                    const equityColorClass =
                        floatingDiff > 0.01
                            ? "text-emerald-600 dark:text-emerald-400"
                            : floatingDiff < -0.01
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-700 dark:text-gray-300";

                    return (
                        <div className="mt-4 grid grid-cols-2 gap-3 min-w-0">
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">
                                    Balance
                                </p>
                                <p
                                    className="text-lg font-black text-gray-900 dark:text-white truncate"
                                    title={`$${balance.toLocaleString()}`}
                                >
                                    ${balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="min-w-0 pl-3 border-l border-dashboard/80 dark:border-white/[0.08]">
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">
                                    Equity
                                </p>
                                <p
                                    className={cn("text-lg font-black truncate", equityColorClass)}
                                    title={`$${equity.toLocaleString()}`}
                                >
                                    ${equity.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Footer Status & Action Bar */}
            <div className="relative z-10 mx-2 mb-2 rounded-xl border border-dashboard/70 bg-gray-50/80 p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Status Chip (read-only) */}
                    {(() => {
                        // Demo account: display Standard Tier with neutral styling
                        if (!isReal && accountType === "DEMO") {
                            return (
                                <div
                                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-dashboard/80 bg-gray-100/80 px-2.5 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
                                    title="Demo Account - Standard Access"
                                >
                                    <Info size={11} className="shrink-0 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        Standard Tier
                                    </span>
                                </div>
                            );
                        }

                        const elig = account.eligibility;
                        if (elig) {
                            const config =
                                ELIGIBILITY_CHIP[elig.status] ||
                                ELIGIBILITY_CHIP.MISSING_ACCOUNT_INFO;
                            const IconComponent = config.icon === "info" ? Info : Crown;
                            return (
                                <div
                                    className={cn(
                                        "inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5",
                                        config.className
                                    )}
                                    title={elig.description}
                                >
                                    <IconComponent size={10} className="shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        {config.label}
                                    </span>
                                </div>
                            );
                        }
                        // Fallback: old logic
                        const proStatus = account.proStatus || "NONE";
                        const vipStatus = account.vipStatus;
                        if (
                            vipStatus === "PENDING" &&
                            proStatus === "NONE"
                        ) {
                            return (
                                <div className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-2.5 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                    <Crown size={10} className="shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        Pending
                                    </span>
                                </div>
                            );
                        }
                        const configFb =
                            PRO_STATUS_CONFIG[proStatus] ||
                            PRO_STATUS_CONFIG.NONE;
                        const isFree = proStatus === "NONE";
                        const IconFb = isFree ? Info : Crown;
                        return (
                            <div
                                className={cn(
                                    "inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5",
                                    configFb.className
                                )}
                            >
                                <IconFb size={10} className="shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                    {configFb.label}
                                </span>
                            </div>
                        );
                    })()}

                    {/* Action Buttons — unified style */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {shouldShowFirstSyncCta ? (
                            /* Zero-trade: show prominent first-sync CTA */
                            <>
                                {renderUnlockProButton()}
                                {preferredSyncMethod === "MANUAL" ? (
                                    <Link
                                        href={`/dashboard/journal?action=log-trade&accountId=${account.id}&source=account-card`}
                                        onClick={() => {
                                            trackEvent(
                                                "account_card_sync_first_trades_clicked",
                                                {
                                                    method: "MANUAL",
                                                    accountId: account.id,
                                                    source: "account-card",
                                                }
                                            );
                                        }}
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[11px] font-black text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 group/link"
                                    >
                                        <PenLine size={11} />
                                        <span>Log first trade</span>
                                        <ArrowRight
                                            size={10}
                                            className="transition-transform group-hover/link:translate-x-0.5"
                                        />
                                    </Link>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            trackEvent(
                                                "account_card_sync_first_trades_clicked",
                                                {
                                                    method:
                                                        preferredSyncMethod ||
                                                        "TNT_CONNECT",
                                                    accountId: account.id,
                                                    source: "account-card",
                                                }
                                            );
                                            onOpenSyncSetup?.(
                                                preferredSyncMethod
                                            );
                                        }}
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[11px] font-black text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:text-white group/link border-0"
                                        aria-label="Sync first trades"
                                    >
                                        {preferredSyncMethod === "EA_SYNC" ? (
                                            <Zap size={11} />
                                        ) : (
                                            <Monitor size={11} />
                                        )}
                                        <span>Sync first trades</span>
                                        <ArrowRight
                                            size={10}
                                            className="transition-transform group-hover/link:translate-x-0.5"
                                        />
                                    </Button>
                                )}
                                <Link
                                    href={`/dashboard?accountId=${account.id}`}
                                    className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-dashboard bg-white px-3 text-[11px] font-black text-gray-600 shadow-sm transition-all hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 group/link"
                                    title="View Dashboard"
                                >
                                    <ExternalLink
                                        size={10}
                                        className="text-gray-400"
                                    />
                                    <span>Dashboard</span>
                                </Link>
                            </>
                        ) : (
                            /* Normal: existing action buttons */
                            <>
                                {renderUnlockProButton()}

                                <Link
                                    href={`/dashboard?accountId=${account.id}`}
                                    className="text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    title="View Dashboard"
                                >
                                    Dashboard
                                </Link>

                                <span className="text-gray-300 dark:text-white/15 select-none text-xs">·</span>

                                {isSyncing ? (
                                    <span
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-90 select-none"
                                        title="Sync in progress"
                                    >
                                        <RefreshCw className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
                                        <span>Syncing...</span>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsCloudSyncOpen(true)}
                                        className={cn(
                                            "text-xs font-bold transition-colors cursor-pointer",
                                            isLatestSyncFailed
                                                ? "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                                : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                        )}
                                        title={isLatestSyncFailed ? "Sync failed - click to retry" : "Cloud Sync"}
                                    >
                                        {isLatestSyncFailed ? "Retry Sync" : "Sync"}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isCloudSyncOpen && (
                <CloudSyncModal
                    key={account.id}
                    isOpen={true}
                    onClose={() => setIsCloudSyncOpen(false)}
                    account={account}
                    onUpdated={onUpdate}
                    onSyncStarted={onSyncStarted}
                    onRequestSupport={onRequestSupport}
                />
            )}
        </div>
    );
}
