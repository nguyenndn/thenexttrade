"use client";

import Link from "next/link";
import { FileText, Users, BarChart3, Zap, Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import type { ReleaseHealthData } from "@/lib/admin/release-health.server";

interface Props {
    data: ReleaseHealthData;
}

function HealthIndicator({ status }: { status: "green" | "amber" | "red" }) {
    const colors = {
        green: "bg-emerald-500",
        amber: "bg-amber-500",
        red: "bg-red-500",
    };
    return (
        <div
            className={`w-2.5 h-2.5 rounded-full ${colors[status]} shrink-0`}
        />
    );
}

function HealthCard({
    title,
    status,
    icon: Icon,
    children,
    href,
}: {
    title: string;
    status: "green" | "amber" | "red";
    icon: React.ElementType;
    children: React.ReactNode;
    href?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <Icon
                            size={16}
                            className="text-gray-600 dark:text-gray-400"
                        />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                        {title}
                    </h3>
                </div>
                <HealthIndicator status={status} />
            </div>
            <div className="space-y-2">{children}</div>
            {href && (
                <Link
                    href={href}
                    className="inline-block mt-3 text-xs text-primary font-semibold hover:underline"
                >
                    View details →
                </Link>
            )}
        </div>
    );
}

function StatRow({
    label,
    value,
    warn,
}: {
    label: string;
    value: number | string;
    warn?: boolean;
}) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span
                className={`font-bold tabular-nums ${warn ? "text-amber-600 dark:text-amber-400" : "text-gray-800 dark:text-white"}`}
            >
                {value}
            </span>
        </div>
    );
}

function FunnelRow({
    label,
    count,
    rate,
    total,
}: {
    label: string;
    count: number;
    rate: number;
    total: number;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                    {label}
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums text-gray-800 dark:text-white">
                        {count}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums w-10 text-right">
                        {rate}%
                    </span>
                </div>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
        </div>
    );
}

export function ReleaseHealthDashboard({ data }: Props) {
    const accountStatus: "green" | "amber" | "red" =
        data.accounts.staleSync > 5
            ? "red"
            : data.accounts.staleSync > 0
              ? "amber"
              : "green";

    const activationStatus: "green" | "amber" | "red" =
        data.activation.newUsersLast7Days === 0 ||
        data.activation.firstTradeRate >= 25
            ? "green"
            : data.activation.firstTradeRate >= 10
              ? "amber"
              : data.activation.newUsersLast7Days >= 5
                ? "red"
                : "green";

    const accountSyncCard = (
        <HealthCard
            title="Account Sync"
            status={accountStatus}
            icon={Activity}
            href="/admin/trading-systems"
        >
            <StatRow label="Total Accounts" value={data.accounts.total} />
            <StatRow label="Connected" value={data.accounts.connected} />
            <StatRow
                label="Stale Sync (>24h)"
                value={data.accounts.staleSync}
                warn={data.accounts.staleSync > 0}
            />
            <StatRow
                label="Never Synced"
                value={data.accounts.neverSynced}
                warn={data.accounts.neverSynced > 0}
            />
        </HealthCard>
    );

    const weeklyReviewsCard = (
        <HealthCard
            title="Weekly Reviews"
            status="green"
            icon={BarChart3}
            href="/dashboard/reports"
        >
            <StatRow
                label="Generated (7d)"
                value={data.reports.weeklyReportsLast7Days}
            />
            <StatRow
                label="Users w/ trades, no review"
                value={data.reports.usersWithTradesNoWeeklyReport}
                warn={data.reports.usersWithTradesNoWeeklyReport > 0}
            />
        </HealthCard>
    );

    const newUsersCard = (
        <HealthCard
            title="New User Activation"
            status={activationStatus}
            icon={Users}
        >
            {data.activation.newUsersLast7Days === 0 ? (
                <p className="text-xs text-gray-400">
                    No new users in the last 7 days
                </p>
            ) : (
                <div className="space-y-2.5">
                    <FunnelRow
                        label="New Users"
                        count={data.activation.newUsersLast7Days}
                        rate={100}
                        total={data.activation.newUsersLast7Days}
                    />
                    <FunnelRow
                        label="→ Added Account"
                        count={data.activation.usersWithAccount}
                        rate={data.activation.accountRate}
                        total={data.activation.newUsersLast7Days}
                    />
                    <FunnelRow
                        label="→ First Trade"
                        count={data.activation.usersWithFirstTrade}
                        rate={data.activation.firstTradeRate}
                        total={data.activation.newUsersLast7Days}
                    />
                    <FunnelRow
                        label="→ Weekly Review"
                        count={data.activation.usersWithWeeklyReview}
                        rate={data.activation.weeklyReviewRate}
                        total={data.activation.newUsersLast7Days}
                    />
                    <FunnelRow
                        label="→ Partner Pro Req"
                        count={data.activation.usersWithPartnerProRequest}
                        rate={data.activation.partnerProRequestRate}
                        total={data.activation.newUsersLast7Days}
                    />
                </div>
            )}
        </HealthCard>
    );

    const trackingCard = (
        <HealthCard
            title="Action Tracking (7d)"
            status="green"
            icon={Zap}
            href="/admin/analytics"
        >
            <StatRow
                label="Activation Clicks"
                value={data.analytics.activationCtaClicksLast7Days}
            />
            <StatRow
                label="Empty State Clicks"
                value={data.analytics.emptyStateClicksLast7Days}
            />
            <StatRow
                label="Mission → Report"
                value={data.analytics.missionReportCtaClicksLast7Days}
            />
            <StatRow
                label="Generate Review"
                value={data.analytics.weeklyReviewGenerateClicksLast7Days}
            />
            <StatRow
                label="Review Success"
                value={data.analytics.weeklyReviewGenerateSuccessLast7Days}
            />
            <StatRow
                label="Review No Data"
                value={data.analytics.weeklyReviewNoDataBlocksLast7Days}
                warn={data.analytics.weeklyReviewNoDataBlocksLast7Days > 5}
            />
        </HealthCard>
    );

    return (
        <div className="space-y-6">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="overflow-x-auto scrollbar-hide flex">
                        <TabsList className="shrink-0">
                            <TabsTrigger
                                value="all"
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                All Metrics
                            </TabsTrigger>
                            <TabsTrigger
                                value="activation"
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                Activation & Engagement
                            </TabsTrigger>
                            <TabsTrigger
                                value="ops"
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                System Ops
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                        Last updated:{" "}
                        {new Date().toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </div>
                </div>

                <TabsContent value="all" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {accountSyncCard}
                        {weeklyReviewsCard}
                        {newUsersCard}
                        {trackingCard}
                    </div>
                </TabsContent>

                <TabsContent value="activation" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {newUsersCard}
                        {weeklyReviewsCard}
                        {trackingCard}
                    </div>
                </TabsContent>

                <TabsContent value="ops" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {accountSyncCard}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
