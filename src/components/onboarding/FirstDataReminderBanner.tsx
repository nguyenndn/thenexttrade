"use client";

import { useEffect, useRef, useTransition } from "react";
import { AlertCircle, ArrowRight, Clock, Monitor, Zap, PenLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { dismissFirstDataReminderAction } from "@/actions/first-session-onboarding";
import { trackEvent } from "@/lib/track";
import type { SyncMethod } from "@/lib/onboarding/first-session.server";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FirstDataReminderBannerProps {
  preferredSyncMethod: SyncMethod;
  firstAccountCreatedAt?: string;
}

// ---------------------------------------------------------------------------
// CTA config
// ---------------------------------------------------------------------------

const CTA_CONFIG: Record<
  SyncMethod,
  { label: string; href: string; icon: React.ReactNode }
> = {
  TNT_CONNECT: {
    label: "Open TNT Connect Setup",
    href: "/dashboard/accounts?setup=sync&method=tnt&source=first-data-reminder",
    icon: <Monitor size={13} className="shrink-0" />,
  },
  EA_SYNC: {
    label: "Open EA Setup",
    href: "/dashboard/accounts?setup=sync&method=ea&source=first-data-reminder",
    icon: <Zap size={13} className="shrink-0" />,
  },
  MANUAL: {
    label: "Log First Trade",
    href: "/dashboard/journal?action=log-trade&source=first-data-reminder",
    icon: <PenLine size={13} className="shrink-0" />,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FirstDataReminderBanner({
  preferredSyncMethod,
  firstAccountCreatedAt,
}: FirstDataReminderBannerProps) {
  const [isPending, startTransition] = useTransition();
  const hasTrackedRef = useRef(false);

  // Compute account age in hours for tracking
  const accountAgeHours = firstAccountCreatedAt
    ? Math.round(
        (Date.now() - new Date(firstAccountCreatedAt).getTime()) /
          (1000 * 60 * 60)
      )
    : 0;

  // Track viewed event — once per mount
  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackEvent("first_data_24h_reminder_viewed", {
        method: preferredSyncMethod,
        accountAgeHours,
        source: "dashboard",
      });
    }
  }, [preferredSyncMethod, accountAgeHours]);

  const cta = CTA_CONFIG[preferredSyncMethod];

  const handleDismiss = () => {
    trackEvent("first_data_24h_reminder_dismissed", {
      method: preferredSyncMethod,
      accountAgeHours,
      source: "dashboard",
    });
    startTransition(async () => {
      await dismissFirstDataReminderAction();
    });
  };

  const handleCtaClick = () => {
    trackEvent("first_data_24h_reminder_clicked", {
      method: preferredSyncMethod,
      accountAgeHours,
      source: "dashboard",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-500/15 bg-amber-50/80 dark:bg-amber-500/[0.04] transition-all">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <AlertCircle
          size={16}
          className="text-amber-500 shrink-0 mt-0.5"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800 dark:text-white leading-snug">
            Your account is connected, but no trade data yet.
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            Sync your first trades to unlock charts, Trade Score, and your first
            review.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Link href={cta.href} onClick={handleCtaClick} className="flex-1 sm:flex-initial">
          <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] h-8 px-3.5 rounded-xl shadow-sm shadow-amber-500/20 border-0 flex items-center gap-1.5 whitespace-nowrap transition-all">
            {cta.icon}
            <span>{cta.label}</span>
            <ArrowRight size={12} className="shrink-0" />
          </Button>
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 whitespace-nowrap disabled:opacity-50 shrink-0"
        >
          <Clock size={10} />
          <span>Remind me tomorrow</span>
        </button>
      </div>
    </div>
  );
}
