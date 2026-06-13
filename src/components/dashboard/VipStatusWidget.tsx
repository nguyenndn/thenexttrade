"use client";

import { useProAccess } from "@/components/pro/ProProvider";
import { Crown, Loader2, Shield, Timer, AlertTriangle, ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
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
 ACTIVE: {
 label: "Pro Active",
 description: "Full access to all Pro features.",
 icon: Crown,
 cardBg: "bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-500/10 dark:to-teal-500/5",
 cardBorder: "border-emerald-200/80 dark:border-emerald-500/25",
 iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
 iconColor: "text-emerald-600 dark:text-emerald-400",
 labelColor: "text-emerald-700 dark:text-emerald-400",
 badgeClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
 },
 GRACE: {
 label: "Grace Period",
 description: "Temporary Pro access. Complete verification.",
 icon: Timer,
 cardBg: "bg-gradient-to-br from-violet-50 to-purple-50/60 dark:from-violet-500/10 dark:to-purple-500/5",
 cardBorder: "border-violet-200/80 dark:border-violet-500/25",
 iconBg: "bg-violet-100 dark:bg-violet-500/20",
 iconColor: "text-violet-600 dark:text-violet-400",
 labelColor: "text-violet-700 dark:text-violet-400",
 badgeClass: "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
 },
 EXPIRED: {
 label: "Access Expired",
 description: "Submit a VIP request to reactivate Pro.",
 icon: AlertTriangle,
 cardBg: "bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-500/10 dark:to-orange-500/5",
 cardBorder: "border-amber-200/80 dark:border-amber-500/25",
 iconBg: "bg-amber-100 dark:bg-amber-500/20",
 iconColor: "text-amber-600 dark:text-amber-400",
 labelColor: "text-amber-700 dark:text-amber-400",
 badgeClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
 },
 REVOKED: {
 label: "Access Revoked",
 description: "Contact support for assistance.",
 icon: Shield,
 cardBg: "bg-gradient-to-br from-red-50 to-rose-50/60 dark:from-red-500/10 dark:to-rose-500/5",
 cardBorder: "border-red-200/80 dark:border-red-500/25",
 iconBg: "bg-red-100 dark:bg-red-500/20",
 iconColor: "text-red-600 dark:text-red-400",
 labelColor: "text-red-700 dark:text-red-400",
 badgeClass: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
 },
 NONE: {
 label: "Free Plan",
 description: "Apply as a VIP trader to unlock Pro for free.",
 icon: Crown,
 cardBg: "bg-white dark:bg-white/[0.03]",
 cardBorder: "border-dashboard dark:border-white/8",
 iconBg: "bg-gray-100 dark:bg-white/8",
 iconColor: "text-gray-400 dark:text-gray-500",
 labelColor: "text-gray-700 dark:text-gray-300",
 badgeClass: "",
 },
};

const accountStatusBadge: Record<string, string> = {
 ACTIVE: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
 GRACE: "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400",
 EXPIRED: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
 REVOKED: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400",
 NONE: "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400",
};

export function VipStatusWidget() {
 const proAccess = useProAccess();
 const searchParams = useSearchParams();
 const [vipRequest, setVipRequest] = useState<VipRequest | null>(null);
 const [loadingVip, setLoadingVip] = useState(true);
 const [showBenefits, setShowBenefits] = useState(false);

 const currentAccountId = searchParams?.get("accountId") ?? undefined;

 // State to hold the actively selected account ID, resolved client-side to prevent SSR hydration mismatch
 const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

 // Helper to read cookie on the client side
 const getCookie = useCallback((name: string) => {
 if (typeof window === "undefined" || typeof document === "undefined") return null;
 const value = `; ${document.cookie}`;
 const parts = value.split(`; ${name}=`);
 if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
 return null;
 }, []);

 useEffect(() => {
 // 1. Initial resolution on mount/render
 const urlAccountId = searchParams?.get("accountId");
 const cookieAccountId = getCookie("last_account_id");
 setActiveAccountId(urlAccountId || cookieAccountId || proAccess.mainAccountId || null);

 // 2. Event listener for account changes
 const handleAccountChange = (e: Event) => {
 const customEvent = e as CustomEvent<string>;
 if (customEvent.detail) {
 setActiveAccountId(customEvent.detail);
 }
 };

 window.addEventListener("tnt_account_changed", handleAccountChange);
 return () => {
 window.removeEventListener("tnt_account_changed", handleAccountChange);
 };
 }, [currentAccountId, proAccess.mainAccountId, searchParams, getCookie]);

 const resolvedAccountId = activeAccountId || proAccess.mainAccountId || undefined;



 useEffect(() => {
 import("@/actions/vip-request")
 .then((mod) => mod.getMyVipRequest(resolvedAccountId))
 .then((vip) => setVipRequest(vip as any))
 .catch(() => {})
 .finally(() => setLoadingVip(false));
 }, [resolvedAccountId]);

 if (proAccess.loading) {
 return (
 <div className="rounded-2xl border border-dashboard dark:border-white/8 bg-white dark:bg-white/[0.03] p-4">
 <div className="flex items-center gap-2.5 text-gray-400 dark:text-gray-500">
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 <span className="text-xs font-medium">Loading status...</span>
 </div>
 </div>
 );
 }

 // Hide entire widget for users with no trading accounts —
 // "Check Pro Eligibility" is confusing before account setup
 if (proAccess.accounts.length === 0) {
 return null;
 }

 // Derive status and details from selected/main account, fallback to aggregate
 const activeAccount = resolvedAccountId
 ? proAccess.accounts.find((a) => a.tradingAccountId === resolvedAccountId)
 : null;
 const status = activeAccount ? activeAccount.status : (proAccess.status || "NONE");
 const isPro = activeAccount ? activeAccount.isPro : proAccess.isPro;
 const expiresAt = activeAccount ? activeAccount.expiresAt : proAccess.expiresAt;
 const cfg = statusConfig[status] || statusConfig.NONE;
 const StatusIcon = cfg.icon;
 const hasPendingRequest = !loadingVip && vipRequest?.status === "PENDING";
 const { accounts } = proAccess;

 // ─── FREE PLAN ───────────────────────────────────────────────────────────────
 if (status === "NONE") {
 let ctaHref = "/dashboard/accounts?action=add&intent=unlock-pro";
 if (accounts && accounts.length > 0) {
 // Prioritize the currently viewed account, otherwise the first free account
 const targetAccount = accounts.find(a => a.tradingAccountId === currentAccountId) || accounts[0];
 ctaHref = `/dashboard/accounts?action=add&intent=unlock-pro&sourceAccountId=${targetAccount.tradingAccountId}`;
 }

 return (
 <>
 <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#141721] transition-all duration-500">
 {/* Gradient Border */}
 <div className="absolute inset-0 rounded-2xl p-px">
 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/30 via-orange-400/15 to-amber-400/30 dark:from-amber-400/20 dark:via-orange-500/10 dark:to-amber-400/20 opacity-60" />
 </div>

 {/* Ambient Glow */}
 <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/8 dark:bg-amber-500/15 rounded-full blur-[35px] pointer-events-none" />

 {/* Inner Card */}
 <div className="relative m-px rounded-2xl bg-white dark:bg-[#141721] overflow-hidden">
 {/* Top accent line */}
 <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

 <div className="px-4 py-4 space-y-3">
 {/* Header Row */}
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/15 to-orange-400/10 dark:from-amber-400/20 dark:to-orange-400/10 ring-1 ring-amber-300/30 dark:ring-amber-500/20">
 <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white">Free Plan</span>
 <span className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
 Current
 </span>
 </div>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Upgrade to unlock Pro features</p>
 </div>
 </div>

 {hasPendingRequest ? (
 <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2.5">
 <Timer className="h-4 w-4 text-amber-500 shrink-0" />
 <div>
 <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">VIP Request Submitted</p>
 <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
 {new Date(vipRequest!.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Awaiting review
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 <button
 onClick={() => setShowBenefits(true)}
 className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
 >
 View Pro benefits
 <ChevronRight className="h-3 w-3" />
 </button>

 <Link
 href={ctaHref}
 className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 hover:from-amber-600 hover:to-orange-600 hover:shadow-md hover:shadow-amber-500/25 hover:-translate-y-px active:translate-y-0"
 >
 Check Pro Eligibility
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 )}
 </div>
 </div>
 </div>

 <ProBenefitsModal isOpen={showBenefits} onClose={() => setShowBenefits(false)} isPro={false} />
 </>
 );
 }

 // ─── PRO ACTIVE ──────────────────────────────────────────────────────────────
 if (status === "ACTIVE") {
 return (
 <>
 <div
 className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#141721] cursor-pointer group transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/8 dark:hover:shadow-emerald-500/15"
 onClick={() => setShowBenefits(true)}
 >
 {/* Animated Gradient Border */}
 <div className="absolute inset-0 rounded-2xl p-px">
 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/40 via-teal-400/20 to-cyan-400/40 dark:from-emerald-400/30 dark:via-teal-500/15 dark:to-cyan-400/30 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
 </div>

 {/* Ambient Glow */}
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
 <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-500/8 dark:bg-teal-400/15 rounded-full blur-[35px] pointer-events-none" />

 {/* Inner Card */}
 <div className="relative m-px rounded-2xl bg-white dark:bg-[#141721] overflow-hidden">
 {/* Top accent line */}
 <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

 <div className="flex items-center gap-3.5 px-4 py-4">
 {/* Icon */}
 <div className="relative shrink-0">
 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/10 ring-1 ring-emerald-300/40 dark:ring-emerald-500/25 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:shadow-emerald-500/15">
 <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
 </div>
 {/* Active pulse dot */}
 <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-[#141721]" />
 </span>
 </div>

 {/* Text Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white">
 Pro Active
 </span>
 <span className="rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 dark:ring-emerald-500/25">
 PRO
 </span>
 </div>

 {/* CTA */}
 <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-400/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
 View your benefits
 <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <ProBenefitsModal isOpen={showBenefits} onClose={() => setShowBenefits(false)} isPro={true} />
 </>
 );
 }

 // ─── GRACE / EXPIRED / REVOKED ───────────────────────────────────────────────

 // Map status to gradient colors for the border effect
 const borderGradient: Record<string, string> = {
 GRACE: "from-violet-400/30 via-purple-400/15 to-violet-400/30 dark:from-violet-400/20 dark:via-purple-500/10 dark:to-violet-400/20",
 EXPIRED: "from-amber-400/30 via-orange-400/15 to-amber-400/30 dark:from-amber-400/20 dark:via-orange-500/10 dark:to-amber-400/20",
 REVOKED: "from-red-400/30 via-rose-400/15 to-red-400/30 dark:from-red-400/20 dark:via-rose-500/10 dark:to-red-400/20",
 };

 const accentLine: Record<string, string> = {
 GRACE: "via-violet-400/50",
 EXPIRED: "via-amber-400/50",
 REVOKED: "via-red-400/50",
 };

 return (
 <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#141721] transition-all duration-500">
 {/* Gradient Border */}
 <div className="absolute inset-0 rounded-2xl p-px">
 <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${borderGradient[status] || borderGradient.EXPIRED} opacity-60`} />
 </div>

 {/* Inner Card */}
 <div className="relative m-px rounded-2xl bg-white dark:bg-[#141721] overflow-hidden">
 {/* Top accent line */}
 <div className={`h-px bg-gradient-to-r from-transparent ${accentLine[status] || accentLine.EXPIRED} to-transparent`} />

 <div className="px-4 py-4 space-y-3">
 {/* Header Row */}
 <div className="flex items-center gap-3">
 <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ring-1 ring-black/5 dark:ring-white/10`}>
 <StatusIcon className={`h-5 w-5 ${cfg.iconColor}`} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className={`text-sm font-black tracking-tight ${cfg.labelColor}`}>{cfg.label}</span>
 {isPro && (
 <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ring-1 ring-current/15 ${cfg.badgeClass}`}>
 Pro
 </span>
 )}
 </div>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{cfg.description}</p>
 </div>
 </div>

 {/* Grace expiry */}
 {status === "GRACE" && expiresAt && (
 <div className="flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 px-3 py-2">
 <Timer className="h-3.5 w-3.5 text-violet-500 shrink-0" />
 <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
 Expires {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
 </p>
 </div>
 )}

 {/* CTAs */}
 {!isPro && (status === "EXPIRED" || status === "REVOKED") && (
 <Link
 href="/dashboard/accounts?action=add&intent=unlock-pro"
 className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all duration-300 hover:from-amber-600 hover:to-orange-600 hover:shadow-md hover:shadow-amber-500/25 hover:-translate-y-px active:translate-y-0"
 >
 Re-apply for Pro
 <ArrowRight className="h-3 w-3" />
 </Link>
 )}

 {status === "GRACE" && (
 <Link
 href="/dashboard/accounts?action=add&intent=unlock-pro"
 className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20 transition-all duration-300 hover:from-violet-600 hover:to-purple-600 hover:shadow-md hover:shadow-violet-500/25 hover:-translate-y-px active:translate-y-0"
 >
 Complete Verification
 <ArrowRight className="h-3 w-3" />
 </Link>
 )}
 </div>
 </div>
 </div>
 );
}
