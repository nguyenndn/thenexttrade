"use client";

import { useState } from "react";
import {
    Star,
    Trophy,
    MoreVertical,
    Settings,
    Trash2,
    Crown,
    Info,
    Clock,
    Cable,
    RefreshCw,
    LifeBuoy,
    X,
} from "lucide-react";
import { cancelCloudSyncJob } from "@/actions/cloud-sync";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloudSyncModal } from "./CloudSyncModal";
import { cn } from "@/lib/utils";
import { normalizeSyncSource, formatSyncErrorMessage } from "@/lib/sync/sync-source";
import type { SyncMethod } from "@/lib/onboarding/first-session.server";

interface AccountTableProps {
    accounts: any[];
    mainAccountId: string | null;
    onSetMain: (id: string) => Promise<void>;
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onSettings: (account: any) => void;
    onUnlockPro?: (account: any) => void;
    preferredSyncMethod?: SyncMethod;
    onOpenSyncSetup?: (method?: SyncMethod) => void;
    activeSyncingAccounts?: Record<string, { jobId?: string; startedAt: number }>;
    onSyncStarted?: (accountId: string, jobId?: string) => void;
    onRequestSupport?: (accountId: string) => void;
    userTickets?: any[];
}

const getAccountType = (
    type: string | null | undefined,
    server?: string | null
): string | null => {
    if (!type) return null;
    const t = type.toUpperCase();
    if (t === "PERSONAL") {
        if (server?.toLowerCase().includes("demo")) return "DEMO";
        return "REAL";
    }
    if (t === "DEMO" || t === "CONTEST") return "DEMO";
    return t;
};

function getSyncMethod(account: any): {
    label: string;
    variant: "ea" | "paused" | "none";
} {
    if (account.autoSync === false)
        return { label: "Sync Paused", variant: "paused" };

    const source = normalizeSyncSource(account.syncSource);
    if (source === "EA_SYNC" || source === "APP" || source === "WINDOWS_IMPORT")
        return { label: "EA Sync", variant: "ea" };
    if (account.syncSource === "CLOUD_WORKER")
        return { label: "Cloud Sync", variant: "ea" };
    if (source === "MANUAL")
        return { label: "Manual Entry", variant: "paused" };

    if (
        account.eaVersion ||
        account.appLastHeartbeat ||
        account.lastHeartbeat ||
        account.lastSync
    )
        return { label: "EA Sync", variant: "ea" };

    return { label: "Offline", variant: "none" };
}

export function AccountTable({
    accounts,
    mainAccountId,
    onSetMain,
    onUpdate,
    onDelete,
    onSettings,
    onUnlockPro,
    preferredSyncMethod,
    onOpenSyncSetup,
    activeSyncingAccounts,
    onSyncStarted,
    onRequestSupport,
    userTickets = [],
}: AccountTableProps) {
    const [cloudSyncAccount, setCloudSyncAccount] = useState<any>(null);

    // Map active pending support sync tickets by tradingAccountId or accountNumber
    const pendingTicketsByAccount = (userTickets || []).reduce<Record<string, any>>(
        (acc, ticket) => {
            if (ticket.status === "PENDING") {
                if (ticket.tradingAccountId) {
                    acc[ticket.tradingAccountId] = ticket;
                }
                if (ticket.accountNumber) {
                    acc[ticket.accountNumber] = ticket;
                }
            }
            return acc;
        },
        {}
    );

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-dashboard/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1E2028]">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider border-b border-dashboard">
                        <tr>
                            <th className="py-3.5 pl-5 pr-4">Account</th>
                            <th className="py-3.5 px-3">Type</th>
                            <th className="py-3.5 px-3">Server</th>
                            <th className="py-3.5 px-3 text-right">Balance</th>
                            <th className="py-3.5 px-4">Last Sync</th>
                            <th className="py-3.5 px-3">Access Tier</th>
                            <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dashboard/60 dark:divide-white/[0.04]">
                        {accounts.map((account) => {
                            const isMain = account.id === mainAccountId;
                            const hasSynced = !!account.lastSync;
                            const accountType = hasSynced
                                ? getAccountType(account.accountType, account.server)
                                : null;
                            const isReal = accountType === "REAL";
                            const syncMethod = getSyncMethod(account);

                            const isAccountSyncing = Boolean(
                                activeSyncingAccounts?.[account.id] ||
                                (account.latestJob &&
                                    (account.latestJob.status === "PENDING" ||
                                        account.latestJob.status === "PROCESSING") &&
                                    Date.now() - new Date(account.latestJob.createdAt).getTime() <
                                        (account.latestJob.status === "PENDING" ? 60000 : 120000))
                            );

                            const latestJob = account.latestJob;
                            const isLatestSyncFailed = Boolean(
                                !isAccountSyncing &&
                                latestJob &&
                                latestJob.status === "FAILED" &&
                                (!account.lastSync ||
                                    new Date(latestJob.createdAt).getTime() > new Date(account.lastSync).getTime() ||
                                    (latestJob.completedAt && new Date(latestJob.completedAt).getTime() > new Date(account.lastSync).getTime()))
                            );

                            const balance = account.balance || 0;

                            const isUnderReview =
                                account.vipStatus === "PENDING" ||
                                account.eligibility?.status === "PENDING_REVIEW" ||
                                account.eligibility?.status === "PENDING";

                            const pendingTicket =
                                pendingTicketsByAccount[account.id] ||
                                (account.accountNumber
                                    ? pendingTicketsByAccount[account.accountNumber]
                                    : null);
                            const hasPendingSupport = Boolean(pendingTicket);

                            return (
                                <tr
                                    key={account.id}
                                    className="group transition-colors hover:bg-gray-50/75 dark:hover:bg-white/[0.02]"
                                >
                                    {/* 1. Account Name & Number with Main Star */}
                                    <td className="py-4 pl-5 pr-4 align-middle">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <button
                                                onClick={() => onSetMain(account.id)}
                                                className="group/star text-gray-300 hover:text-amber-500 transition-colors shrink-0"
                                                title={isMain ? "Main Trading Account" : "Click to set as Main"}
                                                aria-label={isMain ? "Main Trading Account" : "Set as main account"}
                                            >
                                                <Star
                                                    size={15}
                                                    className={cn(
                                                        "transition-all",
                                                        isMain
                                                            ? "fill-amber-500 text-amber-500 scale-110"
                                                            : "fill-transparent group-hover/star:text-amber-500"
                                                    )}
                                                />
                                            </button>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="text-sm font-bold text-gray-900 group-hover:text-primary dark:text-white transition-colors truncate block"
                                                        title={account.name}
                                                    >
                                                        {account.name}
                                                    </span>
                                                    {account.useForLeaderboard && (
                                                        <span title="Leaderboard Active" className="inline-flex items-center">
                                                            <Trophy
                                                                size={12}
                                                                className="text-yellow-500 shrink-0"
                                                            />
                                                        </span>
                                                    )}
                                                    {isMain && (
                                                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                                            MAIN
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block tracking-wide tabular-nums font-mono">
                                                        #{account.accountNumber || "—"}
                                                    </span>
                                                    {hasPendingSupport && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onRequestSupport?.(account.id)}
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                                            title="Manual sync support request pending. Click to view ticket."
                                                        >
                                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                                            Support Pending
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Type (REAL / DEMO) */}
                                    <td className="py-4 px-3 align-middle whitespace-nowrap">
                                        {accountType ? (
                                            <span
                                                className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                    isReal
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                                        : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                                                )}
                                            >
                                                {accountType}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>

                                    {/* 3. Server / Broker */}
                                    <td className="py-4 px-3 align-middle">
                                        <div className="max-w-[170px] min-w-0">
                                            <span
                                                className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block"
                                                title={account.server || "Server Unknown"}
                                            >
                                                {account.server || "Server Unknown"}
                                            </span>
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate block">
                                                {account.broker || "MetaTrader 5"}
                                            </span>
                                        </div>
                                    </td>

                                    {/* 4. Balance */}
                                    <td className="py-4 px-3 align-middle text-right whitespace-nowrap">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>

                                    {/* 5. Last Sync */}
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        {isAccountSyncing ? (
                                            <div
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm"
                                                title="Sync in progress via TNT Cloud Worker..."
                                            >
                                                <RefreshCw className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
                                                <span>Syncing...</span>
                                            </div>
                                        ) : isLatestSyncFailed ? (
                                            <button
                                                type="button"
                                                onClick={() => setCloudSyncAccount(account)}
                                                className="group/failed flex flex-col gap-0.5 text-left cursor-pointer"
                                                title={formatSyncErrorMessage(latestJob)}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2 shrink-0">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                                    </span>
                                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 group-hover/failed:underline flex items-center gap-1">
                                                        Sync Failed
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 pl-3.5">
                                                    {account.lastSync
                                                        ? `Last: ${formatDistanceToNow(new Date(account.lastSync), {
                                                              addSuffix: true,
                                                              locale: enUS,
                                                          })}`
                                                        : "Never synced"}
                                                </span>
                                            </button>
                                        ) : syncMethod.variant === "ea" ? (
                                            <div
                                                className="flex items-center gap-2"
                                                title={`Status: Active (${syncMethod.label})`}
                                            >
                                                <span className="relative flex h-2 w-2 shrink-0">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                </span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {account.lastSync
                                                        ? formatDistanceToNow(new Date(account.lastSync), {
                                                              addSuffix: true,
                                                              locale: enUS,
                                                          })
                                                        : "Connected"}
                                                </span>
                                            </div>
                                        ) : syncMethod.variant === "paused" ? (
                                            <div
                                                className="flex items-center gap-2"
                                                title={`Status: ${syncMethod.label}`}
                                            >
                                                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    {syncMethod.label}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
                                                {onOpenSyncSetup ? (
                                                    <button
                                                        onClick={() => onOpenSyncSetup(preferredSyncMethod)}
                                                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                                        title="Connect Cloud Sync or EA Trade Manager"
                                                    >
                                                        <Cable size={12} /> Connect
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                                        Not Connected
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* 7. Access Tier */}
                                    <td className="py-4 px-3 align-middle whitespace-nowrap">
                                        {!isReal && accountType === "DEMO" ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-dashboard/80 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                                                <Info size={10} className="text-gray-400" /> Standard
                                            </span>
                                        ) : account.proStatus === "ACTIVE" ||
                                          account.eligibility?.status === "PRO_ACTIVE" ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                <Crown size={10} className="text-emerald-500" /> Pro
                                            </span>
                                        ) : isUnderReview ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                                <Clock size={10} className="text-amber-500" /> Reviewing
                                            </span>
                                        ) : account.eligibility?.canRequest && onUnlockPro ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onUnlockPro(account)}
                                                className="h-7 px-2.5 text-[10px] font-black rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 transition-all shadow-sm gap-1.5"
                                            >
                                                <Crown size={10} className="text-amber-500" />
                                                {account.eligibility.status === "REJECTED" ? "Re-apply" : "Unlock Pro"}
                                            </Button>
                                        ) : account.eligibility?.status === "REJECTED" ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-red-500/20 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                                                <Info size={10} /> Not Approved
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                Free
                                            </span>
                                        )}
                                    </td>

                                    {/* 8. Actions */}
                                    <td className="py-4 pl-3 pr-5 align-middle text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2.5">
                                            <Link
                                                href={`/dashboard?accountId=${account.id}`}
                                                className="text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                                title="View Dashboard"
                                            >
                                                Dashboard
                                            </Link>

                                            <span className="text-gray-300 dark:text-white/15 select-none text-xs">·</span>

                                            {isAccountSyncing ? (
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
                                                    onClick={() => setCloudSyncAccount(account)}
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

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        aria-label="Account options"
                                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
                                                    >
                                                        <MoreVertical size={15} />
                                                    </button>
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

                                                    <DropdownMenuItem
                                                        onClick={() => onSetMain(account.id)}
                                                        disabled={isMain}
                                                        className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Star
                                                            size={15}
                                                            className={isMain ? "text-amber-500 fill-current" : "text-gray-500"}
                                                        />
                                                        <span>{isMain ? "Main Account" : "Set as Main"}</span>
                                                    </DropdownMenuItem>

                                                    {onRequestSupport && (
                                                        <DropdownMenuItem
                                                            onClick={() => onRequestSupport(account.id)}
                                                            className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                                                        >
                                                            <LifeBuoy size={15} className="text-amber-500" />
                                                            <span>{hasPendingSupport ? "View Support Ticket" : "Sync Support"}</span>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {isAccountSyncing && (
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
                                                                    if (!res.ok) throw new Error(data.error);
                                                                    toast.success(
                                                                        data.useForLeaderboard
                                                                            ? "Account set for leaderboard!"
                                                                            : "Account removed from leaderboard"
                                                                    );
                                                                    onUpdate();
                                                                } catch (e: any) {
                                                                    toast.error(e.message || "Failed to update");
                                                                }
                                                            }}
                                                            className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                                                        >
                                                            <Trophy
                                                                size={15}
                                                                className={
                                                                    account.useForLeaderboard ? "text-yellow-500" : "text-gray-500"
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
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {cloudSyncAccount && (
                <CloudSyncModal
                    key={cloudSyncAccount.id}
                    isOpen={Boolean(cloudSyncAccount)}
                    onClose={() => setCloudSyncAccount(null)}
                    account={cloudSyncAccount}
                    onUpdated={onUpdate}
                    onSyncStarted={onSyncStarted}
                    onRequestSupport={onRequestSupport}
                />
            )}
        </div>
    );
}
