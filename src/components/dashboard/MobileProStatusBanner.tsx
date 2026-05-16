"use client";

import { useProAccess } from "@/components/pro/ProProvider";
import { Crown, Timer, Shield, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Compact Pro status bar for mobile main content area.
 * Visible immediately on mobile (390px+) without requiring the drawer to open.
 * Only renders for non-NONE states (ACTIVE, GRACE, REVOKED, EXPIRED) or NONE with upgrade CTA.
 * Hidden on desktop (lg:hidden) since the sidebar widget handles desktop.
 */
export function MobileProStatusBanner() {
  const { status, isPro, expiresAt, loading } = useProAccess();

  if (loading) return null;

  const currentStatus = status || "NONE";

  if (currentStatus === "ACTIVE") {
    return (
      <div className="lg:hidden mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
        <Crown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Pro Active</span>
        <span className="ml-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Pro</span>
      </div>
    );
  }

  if (currentStatus === "GRACE") {
    return (
      <div className="lg:hidden mb-3 flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-3 py-2">
        <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Grace Period</span>
          {expiresAt && (
            <span className="ml-2 text-[10px] text-purple-600/70 dark:text-purple-400/70">
              Expires {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/accounts?action=add&intent=unlock-pro"
          className="shrink-0 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
        >
          Verify
        </Link>
      </div>
    );
  }

  if (currentStatus === "REVOKED") {
    return (
      <div className="lg:hidden mb-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2">
        <Shield className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-xs font-bold text-red-700 dark:text-red-400 flex-1">Pro Revoked</span>
        <span className="text-[10px] text-red-500 dark:text-red-400/70">Contact support</span>
      </div>
    );
  }

  if (currentStatus === "EXPIRED") {
    return (
      <div className="lg:hidden mb-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">Pro Expired</span>
        <Link
          href="/dashboard/accounts?action=add&intent=unlock-pro"
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Renew <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // NONE — show upgrade nudge (compact)
  if (!isPro) {
    return (
      <div className="lg:hidden mb-3 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2">
        <Crown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Free Plan</span>
        <Link
          href="/dashboard/accounts?action=add&intent=unlock-pro"
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Check Pro Eligibility <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}
