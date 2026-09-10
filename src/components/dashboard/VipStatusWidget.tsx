"use client";

import { useProAccess } from "@/components/pro/ProProvider";
import {
    Crown,
    Loader2,
    Shield,
    Timer,
    AlertTriangle,
    ArrowRight,
    ChevronRight,
    Send,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProBenefitsModal } from "./ProBenefitsModal";

interface VipRequest {
    id: string;
    status: string;
    broker: string;
    createdAt: string;
    reviewedAt: string | null;
    rejectReason: string | null;
}

interface StatusStyle {
    label: string;
    description: string;
    icon: LucideIcon;
    cardBg: string;
    cardBorder: string;
    iconBg: string;
    iconColor: string;
    labelColor: string;
    badgeClass: string;
}

const statusConfig: Record<string, StatusStyle> = {
    TRIAL: {
        label: "Partner Pro Trial",
        description: "All Partner Pro features available. Link an eligible broker account to keep access.",
        icon: Timer,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-amber-500/30 dark:border-amber-500/30",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
        iconColor: "text-amber-600 dark:text-amber-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass:
            "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    ACTIVE: {
        label: "Partner Pro Active",
        description: "Full access to institutional features & telemetry.",
        icon: Crown,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-dashboard dark:border-white/[0.08]",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
        iconColor: "text-amber-600 dark:text-amber-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass:
            "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    GRACE: {
        label: "Grace Period",
        description: "Temporary Pro access. Complete account verification.",
        icon: Timer,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-amber-500/30 dark:border-amber-500/30",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
        iconColor: "text-amber-600 dark:text-amber-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    },
    EXPIRED: {
        label: "Access Expired",
        description: "Apply for Partner Pro to restore institutional features.",
        icon: AlertTriangle,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-amber-500/30 dark:border-amber-500/30",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
        iconColor: "text-amber-600 dark:text-amber-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    },
    REVOKED: {
        label: "Access Suspended",
        description: "Contact support for assistance.",
        icon: Shield,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-red-500/30 dark:border-red-500/30",
        iconBg: "bg-red-500/10 dark:bg-red-500/15",
        iconColor: "text-red-600 dark:text-red-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass:
            "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
    },
    NONE: {
        label: "Free Tier",
        description: "Apply for Partner Pro with an eligible broker account.",
        icon: Crown,
        cardBg: "bg-white dark:bg-[#1E2028]",
        cardBorder: "border-dashboard dark:border-white/[0.08]",
        iconBg: "bg-gray-100 dark:bg-white/[0.06]",
        iconColor: "text-gray-500 dark:text-gray-400",
        labelColor: "text-gray-900 dark:text-white",
        badgeClass: "",
    },
};

const accountStatusBadge: Record<string, string> = {
    TRIAL: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
    ACTIVE: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    GRACE: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
    EXPIRED:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
    REVOKED: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400",
    NONE: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
};

export function VipStatusWidget() {
    const proAccess = useProAccess();
    const searchParams = useSearchParams();
    const [vipRequest, setVipRequest] = useState<VipRequest | null>(null);
    const [loadingVip, setLoadingVip] = useState(true);
    const [showBenefits, setShowBenefits] = useState(false);
    const [vipLink, setVipLink] = useState<string | null>(null);

    const currentAccountId = searchParams?.get("accountId") ?? undefined;

    // State to hold the actively selected account ID, resolved client-side to prevent SSR hydration mismatch
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

    // Helper to read cookie on the client side
    const getCookie = useCallback((name: string) => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
    }, []);

    useEffect(() => {
        // 1. Initial resolution on mount/render
        const urlAccountId = searchParams?.get("accountId");
        const cookieAccountId = getCookie("last_account_id");
        setActiveAccountId(
            urlAccountId || cookieAccountId || proAccess.mainAccountId || null
        );

        // 2. Event listener for account changes
        const handleAccountChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setActiveAccountId(customEvent.detail);
            }
        };

        window.addEventListener("tnt_account_changed", handleAccountChange);
        return () => {
            window.removeEventListener(
                "tnt_account_changed",
                handleAccountChange
            );
        };
    }, [currentAccountId, proAccess.mainAccountId, searchParams, getCookie]);

    const realAccounts = proAccess.accounts.filter(
        (a) => a.tradingAccountId && a.tradingAccountId !== ""
    );
    const validAccountFromActiveId = activeAccountId
        ? realAccounts.find((a) => a.tradingAccountId === activeAccountId)
        : null;
    const validMainAccount = proAccess.mainAccountId
        ? realAccounts.find((a) => a.tradingAccountId === proAccess.mainAccountId)
        : null;

    const activeAccount =
        validAccountFromActiveId ||
        validMainAccount ||
        realAccounts[0] ||
        null;

    const resolvedAccountId = activeAccount?.tradingAccountId || undefined;

    useEffect(() => {
        import("@/actions/vip-request")
            .then((mod) => mod.getMyVipRequest(resolvedAccountId))
            .then((vip) => setVipRequest(vip as any))
            .catch(() => {})
            .finally(() => setLoadingVip(false));
    }, [resolvedAccountId]);

    // Fetch the VIP Telegram invite link — null unless the user is entitled AND
    // the owner has configured VIP_TELEGRAM_URL in env.
    useEffect(() => {
        let cancelled = false;
        import("@/actions/vip-request")
            .then((mod) => mod.getVipLink())
            .then((link) => {
                if (!cancelled) setVipLink(link);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    if (proAccess.loading) {
        return (
            <div className="py-2 px-1">
                <div className="flex items-center gap-2.5 text-gray-400 dark:text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs font-medium">
                        Loading status...
                    </span>
                </div>
            </div>
        );
    }

    // Hide entire widget for users with no trading accounts -
    // "Check Pro Eligibility" is confusing before account setup
    if (proAccess.accounts.length === 0) {
        return null;
    }

    // Derive status and details from selected/main account, fallback to aggregate
    const rawStatus = activeAccount
        ? activeAccount.status
        : proAccess.status || "NONE";

    // If user has no partner broker accounts connected, or if active account is Free (status === "NONE"),
    // always show Free Tier status cleanly
    const hasNoPartnerAccounts =
        proAccess.activityInfo?.reason ===
            "No trading accounts linked to supported partner brokers." ||
        (realAccounts.length > 0 &&
            realAccounts.every((a) => a.status === "NONE"));

    const status =
        hasNoPartnerAccounts || rawStatus === "NONE" ? "NONE" : rawStatus;
    const isPro = status === "NONE" ? false : (activeAccount ? activeAccount.isPro : proAccess.isPro);
    const expiresAt = activeAccount
        ? activeAccount.expiresAt
        : proAccess.expiresAt;
    const cfg = statusConfig[status] || statusConfig.NONE;
    const StatusIcon = cfg.icon;
    const hasPendingRequest = !loadingVip && vipRequest?.status === "PENDING";
    const { accounts } = proAccess;

    // ─── 7-DAY FREE TRIAL ────────────────────────────────────────────────────────
    if (status === "TRIAL") {
        const daysLeft = proAccess.trialInfo?.daysRemaining ?? 7;
        const ctaHref = "/dashboard/accounts?action=add&intent=unlock-pro";

        return (
            <>
                <div className="relative overflow-hidden py-1 transition-all duration-300">
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20">
                                <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                    <span className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                                        Partner Pro Trial
                                    </span>
                                    <span className="rounded-lg bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                        {daysLeft}d left
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug truncate">
                                    All Partner Pro features available
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                <span>Trial Access</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{daysLeft} of 7 days left</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(14, (daysLeft / 7) * 100))}%` }}
                                />
                            </div>

                            <Link
                                href={ctaHref}
                                className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 active:scale-[0.98]"
                            >
                                <span className="truncate">Connect Eligible Account</span>
                                <ArrowRight className="h-3 w-3 shrink-0" />
                            </Link>
                        </div>
                    </div>
                </div>

                <ProBenefitsModal
                    isOpen={showBenefits}
                    onClose={() => setShowBenefits(false)}
                    isPro={true}
                    vipLink={vipLink}
                />
            </>
        );
    }

    // ─── FREE PLAN ───────────────────────────────────────────────────────────────
    if (status === "NONE") {
        let ctaHref = "/dashboard/accounts?action=add&intent=unlock-pro";
        if (accounts && accounts.length > 0) {
            // Prioritize the currently viewed account, otherwise the first free account
            const targetAccount =
                accounts.find((a) => a.tradingAccountId === currentAccountId) ||
                accounts[0];
            ctaHref = `/dashboard/accounts?action=add&intent=unlock-pro&sourceAccountId=${targetAccount.tradingAccountId}`;
        }

        return (
            <>
                <div
                    className="relative overflow-hidden py-1 cursor-pointer group transition-all duration-300"
                    onClick={() => setShowBenefits(true)}
                >
                    <div className="flex items-center gap-2.5 py-1 px-0.5">
                        {/* Icon with status indicator matching Pro Tier */}
                        <div className="relative shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                <Crown className="h-4 w-4" />
                            </div>
                            {/* Status indicator dot */}
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 ring-2 ring-white dark:ring-[#15171E]" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white truncate">
                                    Free Tier
                                </span>
                                <span className="rounded-lg bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-gray-600 dark:text-gray-400 border border-dashboard dark:border-white/10">
                                    FREE
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-amber-500 dark:text-gray-500 dark:group-hover:text-amber-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                Standard features
                            </p>
                        </div>
                    </div>

                    {hasPendingRequest ? (
                        <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-2.5 py-2">
                            <Timer className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
                                    Partner Pro Request Submitted
                                </p>
                                <p className="text-[9px] text-amber-600/70 dark:text-amber-400/60 truncate">
                                    {new Date(
                                        vipRequest!.createdAt
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}{" "}
                                    · Awaiting verification
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2">
                            <Link
                                href={ctaHref}
                                onClick={(e) => e.stopPropagation()}
                                className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 active:scale-[0.98]"
                            >
                                <span className="truncate">
                                    Apply for Partner Pro
                                </span>
                                <ArrowRight className="h-3 w-3 shrink-0" />
                            </Link>
                        </div>
                    )}
                </div>

                <ProBenefitsModal
                    isOpen={showBenefits}
                    onClose={() => setShowBenefits(false)}
                    isPro={false}
                    vipLink={vipLink}
                />
            </>
        );
    }

    // ─── PRO ACTIVE ──────────────────────────────────────────────────────────────
    if (status === "ACTIVE") {
        const rollingLots = proAccess.activityInfo?.rolling30dLots ?? 0;
        const minLots = proAccess.activityInfo?.minLotsRequired ?? 2.0;
        const lotPercent = Math.min(100, (rollingLots / minLots) * 100);
        const policyState = proAccess.policyState;
        const isPaused = policyState === "PAUSED";

        if (isPaused) {
            return (
                <>
                    <div
                        className="relative overflow-hidden py-1 cursor-pointer group transition-all duration-300"
                        onClick={() => setShowBenefits(true)}
                    >
                        <div className="flex items-center gap-2.5 py-1 px-0.5">
                            <div className="relative shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white block whitespace-nowrap">
                                    Pro Paused
                                </span>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 leading-snug truncate">
                                    Trade to restore Pro access
                                </p>
                            </div>
                        </div>

                        {/* Reason Alert */}
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-2 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                                {proAccess.activityInfo?.reason ||
                                    "Volume or activity threshold not reached."}
                            </span>
                        </div>

                        {/* 30-Day Volume Progress */}
                        <div className="mt-2 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] p-2 space-y-1.5 border border-dashboard dark:border-white/[0.06]">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <span>30d Volume</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                                    {rollingLots.toFixed(2)} / {minLots.toFixed(1)} Lots ({lotPercent.toFixed(0)}%)
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                <div
                                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(5, lotPercent))}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-2.5">
                            <Link
                                href="/dashboard/journal"
                                onClick={(e) => e.stopPropagation()}
                                className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 active:scale-[0.98]"
                            >
                                <span className="truncate">Open Journal & Restore</span>
                                <ArrowRight className="h-3 w-3 shrink-0" />
                            </Link>
                        </div>
                    </div>

                    <ProBenefitsModal
                        isOpen={showBenefits}
                        onClose={() => setShowBenefits(false)}
                        isPro={false}
                        vipLink={vipLink}
                    />
                </>
            );
        }

        return (
            <>
                    <div
                        className="relative overflow-hidden py-1 cursor-pointer group transition-all duration-300"
                        onClick={() => setShowBenefits(true)}
                    >
                        <div className="flex items-center gap-2.5 py-1 px-0.5">
                            {/* Icon */}
                            <div className="relative shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    <Crown className="h-4 w-4" />
                                </div>
                                {/* Static status indicator */}
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#15171E]" />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white truncate">
                                        Partner Pro
                                    </span>
                                    <ChevronRight className="h-3.5 w-3.5 text-amber-500/80 group-hover:text-amber-500 dark:text-amber-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
                                </div>
                                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                                    All Features Unlocked
                                </p>
                            </div>
                        </div>

                        {/* Join Pro Telegram — rendered when entitled user + VIP_TELEGRAM_URL configured */}
                        {vipLink && (
                            <a
                                href={vipLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2AABEE] px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-[#2AABEE]/20 transition-all duration-300 hover:bg-[#2298d4] hover:shadow-md hover:shadow-[#2AABEE]/25 active:scale-[0.98]"
                            >
                                <Send className="h-3 w-3 shrink-0" />
                                <span className="truncate">Join Pro Telegram</span>
                            </a>
                        )}
                    </div>

                <ProBenefitsModal
                    isOpen={showBenefits}
                    onClose={() => setShowBenefits(false)}
                    isPro={true}
                    vipLink={vipLink}
                />
            </>
        );
    }

    // ─── GRACE / EXPIRED / REVOKED ───────────────────────────────────────────────
    const borderClass: Record<string, string> = {
        GRACE: "border-amber-500/30 dark:border-amber-500/30",
        EXPIRED: "border-amber-500/30 dark:border-amber-500/30",
        REVOKED: "border-red-500/30 dark:border-red-500/30",
    };

    return (
        <div className="relative overflow-hidden py-1 transition-all duration-300">
            <div className="space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center gap-2.5">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} border border-dashboard dark:border-white/10`}
                    >
                        <StatusIcon
                            className={`h-4 w-4 ${cfg.iconColor}`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                            <span
                                className={`text-[13px] font-black tracking-tight whitespace-nowrap ${cfg.labelColor}`}
                            >
                                {cfg.label}
                            </span>
                            {isPro && (
                                <span
                                    className={`rounded-lg px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${cfg.badgeClass}`}
                                >
                                    PRO
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug truncate">
                            {cfg.description}
                        </p>
                    </div>
                </div>

                {/* Grace expiry */}
                {status === "GRACE" && expiresAt && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-2.5 py-2">
                        <Timer className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 truncate">
                            Expires{" "}
                            {new Date(expiresAt).toLocaleDateString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>
                )}

                {/* CTAs */}
                {!isPro &&
                    (status === "EXPIRED" || status === "REVOKED") && (
                        <Link
                            href="/dashboard/accounts?action=add&intent=unlock-pro"
                            className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 active:scale-[0.98]"
                        >
                            <span className="truncate">
                                Re-apply for Partner Pro
                            </span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                        </Link>
                    )}

                {status === "GRACE" && (
                    <Link
                        href="/dashboard/accounts?action=add&intent=unlock-pro"
                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 active:scale-[0.98]"
                    >
                        <span className="truncate">
                            Complete Verification
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                    </Link>
                )}
            </div>
        </div>
    );
}

