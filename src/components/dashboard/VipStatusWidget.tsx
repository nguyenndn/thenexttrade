"use client";

import { useProAccess } from "@/components/pro/ProProvider";
import { Crown, Loader2, Shield, Timer, AlertTriangle, ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    description: "Verify as a VIP trader to unlock Pro for free.",
    icon: Crown,
    cardBg: "bg-white dark:bg-white/[0.03]",
    cardBorder: "border-gray-200 dark:border-white/8",
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

  useEffect(() => {
    import("@/actions/vip-request")
      .then((mod) => mod.getMyVipRequest(currentAccountId))
      .then((vip) => setVipRequest(vip as any))
      .catch(() => {})
      .finally(() => setLoadingVip(false));
  }, [currentAccountId]);

  if (proAccess.loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-4">
        <div className="flex items-center gap-2.5 text-gray-400 dark:text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs font-medium">Loading status...</span>
        </div>
      </div>
    );
  }

  const status = proAccess.status || "NONE";
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
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1d27] p-4 transition-all">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 dark:from-amber-500/8 dark:to-orange-500/4" />

          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 dark:from-amber-400/15 dark:to-orange-400/10 ring-1 ring-amber-300/30 dark:ring-amber-500/20">
              <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800 dark:text-white">Free Plan</span>
                <span className="rounded-full bg-gray-100 dark:bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Current
                </span>
              </div>

              {hasPendingRequest ? (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2">
                  <span className="mt-0.5 text-amber-500">⏳</span>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">VIP Request Submitted</p>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                      Submitted {new Date(vipRequest!.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Awaiting review
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {/* View Benefits button */}
                  <button
                    onClick={() => setShowBenefits(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    View Pro benefits
                    <ChevronRight className="h-3 w-3" />
                  </button>

                  {/* CTA */}
                  <Link
                    href={ctaHref}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/30 hover:-translate-y-px active:translate-y-0"
                  >
                    Unlock Pro Free
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
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-white dark:bg-[#1a1d27] p-4 transition-all">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/6 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5" />

          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/15 dark:from-emerald-400/20 dark:to-teal-400/10 ring-1 ring-emerald-300/40 dark:ring-emerald-500/25">
              <Crown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Pro Active</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Pro
                </span>
              </div>

              {/* View Benefits button */}
              <button
                onClick={() => setShowBenefits(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                View your benefits
                <ChevronRight className="h-3 w-3" />
              </button>

              {/* Per-account chips */}
              {accounts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {accounts.map((acc) => (
                    <span
                      key={acc.tradingAccountId || acc.accountName}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${accountStatusBadge[acc.status] || accountStatusBadge.NONE}`}
                      title={acc.accountName}
                    >
                      {acc.broker || "Account"} · {statusConfig[acc.status]?.label || "Free"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <ProBenefitsModal isOpen={showBenefits} onClose={() => setShowBenefits(false)} isPro={true} />
      </>
    );
  }

  // ─── GRACE / EXPIRED / REVOKED ───────────────────────────────────────────────
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${cfg.cardBorder} ${cfg.cardBg} p-4 transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
          <StatusIcon className={`h-4 w-4 ${cfg.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${cfg.labelColor}`}>{cfg.label}</span>
            {proAccess.isPro && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.badgeClass}`}>
                Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{cfg.description}</p>

          {/* Grace expiry */}
          {status === "GRACE" && proAccess.expiresAt && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
              <Timer className="h-3 w-3" />
              Expires {new Date(proAccess.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}

          {/* Per-account chips */}
          {accounts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {accounts.map((acc) => (
                <span
                  key={acc.tradingAccountId || acc.accountName}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${accountStatusBadge[acc.status] || accountStatusBadge.NONE}`}
                  title={acc.accountName}
                >
                  {acc.broker || "Account"} · {statusConfig[acc.status]?.label || "Free"}
                </span>
              ))}
            </div>
          )}

          {/* Expired/Revoked CTA */}
          {!proAccess.isPro && (status === "EXPIRED" || status === "REVOKED") && (
            <Link
              href="/dashboard/accounts?action=add&intent=unlock-pro"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:-translate-y-px"
            >
              Re-apply for Pro
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}

          {/* Grace CTA */}
          {status === "GRACE" && (
            <Link
              href="/dashboard/accounts?action=add&intent=unlock-pro"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20 transition-all hover:from-violet-600 hover:to-purple-600 hover:-translate-y-px"
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
