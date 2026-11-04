"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Crown,
    CheckCircle2,
    ExternalLink,
    ArrowRight,
    Copy,
    Check,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { BROKER_INFO, SUPPORTED_BROKERS } from "@/lib/validations/vip-request";

interface BrokerSetupGuideProps {
    verifyHref?: string;
}

/**
 * Compact Fintech Broker Setup Console for the Community VIP section.
 * Displays partner broker selection, a 2x2 Matrix Specs Card, quick registration steps,
 * and 1-click Partner IB Code copy without any IB transfer clutter.
 */
export function BrokerSetupGuide({
    verifyHref = "/dashboard/accounts?action=add&intent=unlock-pro",
}: BrokerSetupGuideProps) {
    const [activeBroker, setActiveBroker] =
        useState<(typeof SUPPORTED_BROKERS)[number]>("EXNESS");
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const info = BROKER_INFO[activeBroker];

    const handleCopy = (value: string, label: string, key: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(key);
        toast.success(`Copied ${label}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="flex h-full flex-col justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] p-4 sm:p-5 shadow-sm">
            <div>
                {/* Console Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold flex items-center gap-1.5">
                            <Crown size={14} />
                            <span>Partner Broker Setup</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Select a partner broker and match the exact account specs below.
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#1E2028] px-2.5 py-1 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 self-start sm:self-auto">
                        <ShieldCheck size={13} />
                        <span>Official Partner Link</span>
                    </span>
                </div>

                {/* Broker Selector Tabs */}
                <Tabs
                    value={activeBroker}
                    onValueChange={(v) =>
                        setActiveBroker(v as (typeof SUPPORTED_BROKERS)[number])
                    }
                    tabsId="brokerSetupGuide"
                >
                    <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white dark:bg-[#1E2028] p-1 rounded-xl border border-gray-200 dark:border-white/10 mb-4">
                        {SUPPORTED_BROKERS.map((b) => (
                            <TabsTrigger
                                key={b}
                                value={b}
                                className="w-full justify-center px-2.5 py-2 text-xs font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-lg"
                                activeIndicatorClassName="!bg-gold shadow-sm border-0"
                                activeTextClassName="!text-white font-bold"
                            >
                                {BROKER_INFO[b].name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Partner Registration Specs (2x2 Matrix Specs Card + Steps + IB Code) */}
                <div className="space-y-3">
                    {/* 2x2 Matrix Specs Card (AGENTS.md UI Invariant #3) */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/10 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] overflow-hidden">
                        <div className="p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Platform
                            </span>
                            <span className="mt-0.5 block text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                                MT5 Real
                            </span>
                        </div>
                        <div className="p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Account Type
                            </span>
                            <span className="mt-0.5 block text-xs sm:text-sm font-black text-amber-600 dark:text-gold truncate">
                                {info.registerGuide.accountType} (
                                {info.registerGuide.currency})
                            </span>
                        </div>
                        <div className="p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Max Leverage
                            </span>
                            <span className="mt-0.5 block text-xs sm:text-sm tabular-nums font-black text-gray-900 dark:text-white truncate">
                                {info.registerGuide.leverage}
                            </span>
                        </div>
                        <div className="p-3 border-t border-gray-200 dark:border-white/10">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Min Deposit
                            </span>
                            <span className="mt-0.5 block text-xs sm:text-sm tabular-nums font-black text-emerald-600 dark:text-emerald-400 truncate">
                                ${info.registerGuide.minDeposit}{" "}
                                {info.registerGuide.currency}
                            </span>
                        </div>
                    </div>

                    {/* Partner IB Code + 1-Click Copy */}
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] px-3.5 py-2.5">
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Official Partner IB Code ({info.name})
                            </span>
                            <span className="block text-xs sm:text-sm tabular-nums font-black text-gray-900 dark:text-white truncate">
                                {info.ibCode}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handleCopy(
                                    info.ibCode,
                                    `${info.name} IB code`,
                                    "ib-new"
                                )
                            }
                            className="h-8 px-3 text-xs font-bold shrink-0"
                        >
                            {copiedField === "ib-new" ? (
                                <Check
                                    size={13}
                                    className="mr-1.5 text-emerald-500"
                                />
                            ) : (
                                <Copy size={13} className="mr-1.5" />
                            )}
                            <span>Copy Code</span>
                        </Button>
                    </div>

                    {/* Quick Registration Steps */}
                    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-3.5 space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                            New {info.name} Account Setup Steps
                        </span>
                        <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
                            {info.registerGuide.steps.map((step, i) => (
                                <li key={i} className="leading-relaxed">
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>

            {/* Bottom Dual Action Bar */}
            <p className="mt-3 text-center text-[11px] font-medium text-gray-400 dark:text-gray-500">
                Partner Affiliate Link · Rebates fund free EA licenses at zero extra spread cost
            </p>
            <div className="mt-4 pt-3.5 border-t border-gray-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                    href={info.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                        variant: "outline",
                        className:
                            "w-full h-10 px-4 font-bold bg-white dark:bg-[#1E2028] text-xs sm:text-sm flex items-center justify-center gap-2",
                    })}
                >
                    <span>Open {info.name} Account</span>
                    <ExternalLink size={14} className="shrink-0" />
                </a>
                <Link
                    href={verifyHref}
                    className={buttonVariants({
                        variant: "gold",
                        className:
                            "w-full h-10 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2",
                    })}
                >
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>Verify in Dashboard</span>
                    <ArrowRight size={14} className="shrink-0" />
                </Link>
            </div>
        </div>
    );
}
