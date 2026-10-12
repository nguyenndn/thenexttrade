"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Crown,
    UserPlus,
    RefreshCw,
    CheckCircle2,
    ExternalLink,
    ArrowRight,
    Send,
    AlertTriangle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { BROKER_INFO, SUPPORTED_BROKERS } from "@/lib/validations/vip-request";

/**
 * Public "How to get VIP" broker setup guide shown on the community page.
 * Renders the exact account configuration each partner broker requires so
 * prospects register under our IB correctly — new clients configure a fresh
 * account, existing clients transfer their IB, then submit their info via the
 * dashboard wizard (no Telegram DM involved).
 */
export function BrokerSetupGuide() {
    const [activeBroker, setActiveBroker] =
        useState<(typeof SUPPORTED_BROKERS)[number]>("EXNESS");
    const info = BROKER_INFO[activeBroker];

    const wizardHref = "/dashboard/accounts?action=add&intent=unlock-pro";

    return (
        <div className="rounded-lg border border-amber-500/25 bg-white/80 dark:bg-[#111625]/60 p-5 sm:p-6 shadow-[0_4px_12px_rgba(245,158,11,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold flex items-center gap-2">
                    <Crown size={14} />
                    Broker Setup Guide
                </h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-gold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Register under our IB to qualify
                </span>
            </div>

            <Tabs
                value={activeBroker}
                onValueChange={(v) =>
                    setActiveBroker(
                        v as (typeof SUPPORTED_BROKERS)[number]
                    )
                }
                tabsId="brokerSetupGuide"
            >
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-gray-50/80 dark:bg-white/5 p-1.5 rounded-lg border border-gray-200 dark:border-white/10 mb-4 backdrop-blur-sm">
                    {SUPPORTED_BROKERS.map((b) => (
                        <TabsTrigger
                            key={b}
                            value={b}
                            className="w-full justify-center px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-lg"
                            activeIndicatorClassName="!bg-gold shadow-md border-0"
                            activeTextClassName="!text-white font-bold"
                        >
                            {BROKER_INFO[b].name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="space-y-4">
                {/* 1. NEW CLIENTS — register & configure */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.06] p-4 space-y-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <UserPlus size={15} className="text-amber-500" />
                        New to {info.name}? Register & configure
                    </p>
                    <ol className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
                        {info.registerGuide.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ol>
                    <a
                        href={info.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                    >
                        <span>Open {info.name} Account</span>
                        <ExternalLink size={12} />
                    </a>
                </div>

                {/* 2. EXISTING CLIENTS — transfer IB */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/[0.06] p-4 space-y-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <RefreshCw size={15} className="text-blue-500" />
                        Already a {info.name} client? Transfer to our IB
                    </p>
                    <ol className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
                        {info.ibTransferGuide.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ol>
                    {info.ibTransferGuide.note && (
                        <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 bg-white dark:bg-[#151925] border border-amber-200 dark:border-amber-500/15 rounded-lg p-2.5 flex items-start gap-1.5">
                            <AlertTriangle
                                size={13}
                                className="shrink-0 mt-0.5"
                            />
                            <span>{info.ibTransferGuide.note}</span>
                        </p>
                    )}
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        Partner IB link:{" "}
                        <span className="font-bold text-gray-700 dark:text-gray-200 break-all">
                            {info.affiliateUrl}
                        </span>{" "}
                        · IB code:{" "}
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                            {info.ibCode}
                        </span>
                    </p>
                </div>

                {/* 3. FINAL STEP — submit info via dashboard */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.06] p-4 space-y-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Send size={15} className="text-amber-500 dark:text-gold" />
                        Final step — submit your info for VIP access
                    </p>
                    <p className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-400">
                        After you&apos;ve registered and deposited, add the account
                        in your dashboard. Our team verifies{" "}
                        <span className="font-semibold text-amber-600 dark:text-gold">
                            {info.name}
                        </span>{" "}
                        under our IB and approves VIP access within 24 hours.
                    </p>
                    <Link
                        href={wizardHref}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:shadow-md hover:shadow-amber-500/25"
                    >
                        Register & Verify in Dashboard
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
