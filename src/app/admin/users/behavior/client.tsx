"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { AlertCircle, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import {
    SyncFilterToolbar,
    type StatusFilterOption,
    type TypeFilterOption,
} from "@/components/admin/SyncFilterToolbar";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { BehaviorStatsGrid } from "@/components/admin/behavior/BehaviorStatsGrid";
import { NeedsAttentionTable } from "@/components/admin/behavior/NeedsAttentionTable";
import { ValueRadarTable } from "@/components/admin/behavior/ValueRadarTable";
import { BehaviorTableSkeleton } from "@/components/admin/behavior/BehaviorTableSkeleton";
import { markUserContacted } from "@/actions/admin-activation";
import { getBehaviorSegments, type GetBehaviorSegmentsResult } from "./actions";

type BehaviorTabKey = "needs-attention" | "value";

const GROUP_OPTIONS: TypeFilterOption[] = [
    { value: "ALL", label: "All Groups" },
    { value: "REGISTERED_NEVER_TRADED", label: "Never Synced" },
    { value: "LOSING_STREAK", label: "Losing Streak" },
    { value: "WINNING_STREAK", label: "Winning Streak" },
    { value: "TRADING_WELL", label: "Steady Trader" },
    { value: "NEUTRAL", label: "Neutral" },
];

interface BehaviorConsoleClientProps {
    initialData: GetBehaviorSegmentsResult["data"] | null;
}

export function BehaviorConsoleClient({
    initialData,
}: BehaviorConsoleClientProps) {
    const [activeTab, setActiveTab] =
        useState<BehaviorTabKey>("needs-attention");
    const [searchQuery, setSearchQuery] = useState("");
    const [groupFilter, setGroupFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [data, setData] = useState<GetBehaviorSegmentsResult["data"] | null>(
        initialData
    );
    const [isPending, startTransition] = useTransition();
    const skippedFirstMount = useRef(Boolean(initialData));

    const fetchSegments = useCallback(
        async (override?: {
            tab?: BehaviorTabKey;
            search?: string;
            group?: string;
            nextPage?: number;
            nextPageSize?: number;
        }) => {
            setIsLoading(true);
            try {
                const res = await getBehaviorSegments({
                    tab: override?.tab ?? activeTab,
                    search: override?.search ?? searchQuery,
                    groupFilter: override?.group ?? groupFilter,
                    page: override?.nextPage ?? page,
                    pageSize: override?.nextPageSize ?? pageSize,
                });
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    toast.error(
                        res.error || "Failed to load behavior telemetry"
                    );
                }
            } catch (err: unknown) {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Network error loading behavior data"
                );
            } finally {
                setIsLoading(false);
            }
        },
        [activeTab, searchQuery, groupFilter, page, pageSize]
    );

    useEffect(() => {
        if (skippedFirstMount.current) {
            skippedFirstMount.current = false;
            return;
        }
        void fetchSegments();
    }, [activeTab, groupFilter, page, pageSize, fetchSegments]);

    const handleMarkContacted = (signalId?: string | null) => {
        if (!signalId) return;
        startTransition(async () => {
            const res = await markUserContacted(signalId);
            if (res.success) {
                toast.success("Trader marked as contacted");
                await fetchSegments();
            } else {
                toast.error(res.error || "Failed to mark contacted");
            }
        });
    };

    const summary = data?.metricsSummary;
    const statusTabs: StatusFilterOption[] = [
        {
            key: "needs-attention",
            label: "Needs Attention",
            count: summary?.needsAttentionCount ?? 0,
            icon: AlertCircle,
        },
        {
            key: "value",
            label: "Value Radar",
            count: summary?.valueTradersCount ?? 0,
            icon: TrendingUp,
        },
    ];

    return (
        <div className="space-y-6">
            <BehaviorStatsGrid summary={summary} />

            <SyncFilterToolbar
                search={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={() => {
                    setPage(1);
                    void fetchSegments({ search: searchQuery, nextPage: 1 });
                }}
                onClearSearch={() => {
                    setSearchQuery("");
                    setPage(1);
                    void fetchSegments({ search: "", nextPage: 1 });
                }}
                statusTabs={statusTabs}
                activeStatus={activeTab}
                onStatusChange={(val) => {
                    setActiveTab(val as BehaviorTabKey);
                    setPage(1);
                }}
                typeValue={groupFilter}
                typeOptions={GROUP_OPTIONS}
                onTypeChange={(val) => {
                    setGroupFilter(val);
                    setPage(1);
                }}
                typeLabel="Group:"
                onRefresh={() => void fetchSegments()}
                isRefreshing={isLoading || isPending}
                tabsId="admin-trader-behavior-tabs"
            />

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden">
                {isLoading ? (
                    <BehaviorTableSkeleton />
                ) : !data || data.items.length === 0 ? (
                    <div className="py-16 px-4 text-center space-y-2">
                        <Users
                            size={34}
                            className="mx-auto text-gray-300 dark:text-gray-600"
                        />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            No traders match the current filter
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Try switching behavior groups or clearing the search
                            filter.
                        </p>
                    </div>
                ) : activeTab === "needs-attention" ? (
                    <NeedsAttentionTable
                        items={data.items}
                        isPending={isPending}
                        onMarkContacted={handleMarkContacted}
                    />
                ) : (
                    <ValueRadarTable items={data.items} />
                )}

                {data && data.totalPages > 1 && (
                    <div className="border-t border-gray-200 dark:border-white/10 px-4 bg-gray-50/40 dark:bg-white/[0.01]">
                        <PaginationControl
                            currentPage={data.page}
                            totalPages={data.totalPages}
                            pageSize={data.pageSize}
                            totalItems={data.totalCount}
                            itemName="traders"
                            onPageChange={(nextP) => setPage(nextP)}
                            onPageSizeChange={(nextSize) => {
                                setPageSize(nextSize);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
