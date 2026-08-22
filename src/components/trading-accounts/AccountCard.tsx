"use client";

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
} from "lucide-react";
import Link from "next/link";
import { RemoteSyncButton } from "./RemoteSyncButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";
import type { SyncMethod } from "@/lib/onboarding/first-session.server";
import { normalizeSyncSource } from "@/lib/sync/sync-source";

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
                "bg-purple-50 text-purple-600 border-purple-200/80 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
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

const ELIGIBILITY_CHIP: Record<string, { label: string; className: string }> = {
    PRO_ACTIVE: {
        label: "Pro",
        className:
            "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    },
    PENDING_REVIEW: {
        label: "Under Review",
        className:
            "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    },
    REJECTED: {
        label: "Not Approved",
        className:
            "bg-red-50 text-red-500 border-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    },
    ELIGIBLE: {
        label: "Eligible",
        className:
            "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    },
    UNSUPPORTED_BROKER: {
        label: "Not Supported",
        className:
            "bg-gray-50 text-gray-500 border-dashboard/80 dark:bg-white/5 dark:text-gray-400 ",
    },
    MISSING_ACCOUNT_INFO: {
        label: "Missing Info",
        className:
            "bg-gray-50 text-gray-500 border-dashboard/80 dark:bg-white/5 dark:text-gray-400 ",
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
}: AccountCardProps) {
    // Only trust accountType if account has actually synced at least once
    const hasSynced = !!account.lastSync;
    const accountType = hasSynced
        ? getAccountType(account.accountType, account.server)
        : null;
    const isReal = accountType === "REAL";
    const accentColor = account.color || "hsl(var(--primary))";
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
                        variant="ghost"
                        onClick={() => onUnlockPro(account)}
                        className="flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:text-white"
                        title="Apply for Pro"
                        aria-label="Unlock Pro access"
                    >
                        <Crown size={11} />
                        <span>Unlock Pro</span>
                    </Button>
                );
            }
            return null;
        }
        if (elig.canRequest && onUnlockPro) {
            return (
                <Button
                    variant="ghost"
                    onClick={() => onUnlockPro(account)}
                    className="flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:text-white"
                    title={elig.status === "REJECTED" ? "Re-apply for Pro" : "Apply for Pro"}
                    aria-label={elig.status === "REJECTED" ? "Re-apply for Pro access" : "Unlock Pro access"}
                >
                    <Crown size={11} />
                    <span>{elig.status === "REJECTED" ? "Re-apply" : "Unlock Pro"}</span>
                </Button>
            );
        }
        return null;
    }

    return (
        <div className="group relative flex flex-col rounded-2xl transition-all duration-500 hover:shadow-lg bg-white dark:bg-[#151925] border border-dashboard/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15">
            {/* Left accent border */}
            <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity z-10"
                style={{ backgroundColor: accentColor }}
            />

            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div
                    className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-[60px] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700"
                    style={{ backgroundColor: accentColor }}
                />
            </div>

            {/* === Card Content === */}
            <div className="relative z-10 flex flex-col flex-1 px-5 pt-4 pb-3">
                {/* Top Row: Badges + Menu */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {accountType && (
                        <span
                            className={`text-[9px] font-black px-2 py-[3px] rounded-lg uppercase tracking-[0.1em] border whitespace-nowrap ${
                                isReal
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                    : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                            }`}
                        >
                            {accountType}
                        </span>
                    )}
                    {account.accountNumber && (
                        <span className="text-[9px] font-mono font-bold text-gray-600 dark:text-gray-300 tracking-wider whitespace-nowrap bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/15 px-2 py-[3px] rounded-lg">
                            #{account.accountNumber}
                        </span>
                    )}
                    {account.useForLeaderboard && (
                        <span
                            className="w-5 h-5 rounded-lg inline-flex items-center justify-center bg-yellow-100 border border-yellow-300 dark:bg-yellow-500/15 dark:border-yellow-500/30"
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
                            className="inline-flex items-center gap-1 px-1.5 py-[3px] rounded-lg text-[9px] font-black uppercase tracking-[0.1em] bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 text-yellow-600 dark:text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/5"
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
                                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none shrink-0"
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
                                className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                            >
                                <Settings size={15} className="text-gray-500" />
                                <span>Account Settings</span>
                            </DropdownMenuItem>
                            {onSetMain && (
                                <DropdownMenuItem
                                    onClick={() => onSetMain(account.id)}
                                    disabled={isMain}
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
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
                                className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors"
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
                <div className="mt-4 grid grid-cols-2 gap-3 min-w-0">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">
                            Balance
                        </p>
                        <p
                            className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate"
                            title={`$${(account.balance || 0).toLocaleString()}`}
                        >
                            ${(account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="min-w-0 pl-3 border-l border-dashboard/80 dark:border-white/[0.08]">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">
                            Equity
                        </p>
                        <p
                            className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate"
                            title={`$${(account.equity || account.balance || 0).toLocaleString()}`}
                        >
                            $
                            {(
                                account.equity ||
                                account.balance ||
                                0
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="relative z-10 mx-2 mb-2 rounded-xl border border-dashboard/70 bg-gray-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="space-y-2.5">
                    <div className="flex">
                        {/* Sync Method Badge */}
                        <div
                            className={`inline-flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2.5 shadow-sm ${
                                syncMethod.variant === "ea"
                                    ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20 text-primary dark:text-primary"
                                    : syncMethod.variant === "paused"
                                      ? "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200/80 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                      : "bg-white dark:bg-white/5 border-dashboard/80 text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            <Cable size={11} className="shrink-0" />
                            <span className="truncate text-[10px] font-black uppercase tracking-wider">
                                {syncMethod.label}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Status chips + Action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* Status Chips (read-only) */}
                        {(() => {
                            const elig = account.eligibility;
                            if (elig) {
                                const config =
                                    ELIGIBILITY_CHIP[elig.status] ||
                                    ELIGIBILITY_CHIP.MISSING_ACCOUNT_INFO;
                                return (
                                    <div
                                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 ${config.className}`}
                                        title={elig.description}
                                    >
                                        <Crown size={10} className="shrink-0" />
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
                                    <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
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
                            return (
                                <div
                                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 ${configFb.className}`}
                                >
                                    <Crown size={10} className="shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        {configFb.label}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Action Buttons — unified style */}
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
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[11px] font-black text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 group/link"
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
                                        variant="ghost"
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
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[11px] font-black text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:text-white group/link"
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
                                    className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-dashboard bg-white px-3 text-[11px] font-black text-gray-600 shadow-sm transition-all hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 group/link"
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
                                    className="flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg border border-dashboard bg-white px-3.5 text-[11px] font-black text-gray-950 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-950 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10 dark:hover:text-white group/link"
                                    title="View Dashboard"
                                >
                                    <ExternalLink
                                        size={11}
                                        className="text-gray-500 group-hover/link:text-primary transition-colors"
                                    />
                                    <span>Dashboard</span>
                                </Link>

                                <RemoteSyncButton
                                    tradingAccountId={account.id}
                                    accountName={account.name}
                                    isConnected={account.isConnected}
                                    variant="premium"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
