"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
    LoyaltyClaimRecord,
    LoyaltyClaimStatus,
    LoyaltyTierItem,
} from "@/lib/loyalty/loyalty.types";
import {
    toggleLoyaltyFeature,
    type AdminLoyaltyStats,
} from "@/actions/admin/loyalty";
import { LoyaltyKpiCards } from "./LoyaltyKpiCards";
import { LoyaltyClaimsTable } from "./LoyaltyClaimsTable";
import { LoyaltyTiersMatrix } from "./LoyaltyTiersMatrix";
import { LoyaltyAnalyticsPanel } from "./LoyaltyAnalyticsPanel";
import { ProcessClaimModal } from "./ProcessClaimModal";
import { RefreshCw, Clock, Award, BarChart3, Power } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLoyaltyClientProps {
    initialClaims: LoyaltyClaimRecord[];
    initialStats: AdminLoyaltyStats;
    initialTiers: LoyaltyTierItem[];
    initialLoyaltyEnabled?: boolean;
}

export function AdminLoyaltyClient({
    initialClaims,
    initialStats,
    initialTiers,
    initialLoyaltyEnabled = true,
}: AdminLoyaltyClientProps) {
    const router = useRouter();
    const [claims] = useState<LoyaltyClaimRecord[]>(initialClaims);
    const [stats] = useState<AdminLoyaltyStats>(initialStats);
    const [tiers, setTiers] = useState<LoyaltyTierItem[]>(initialTiers);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState<boolean>(
        initialLoyaltyEnabled
    );
    const [isTogglingFeature, setIsTogglingFeature] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("claims");
    const [statusFilter, setStatusFilter] = useState<
        LoyaltyClaimStatus | "ALL"
    >("ALL");
    const [selectedClaim, setSelectedClaim] =
        useState<LoyaltyClaimRecord | null>(null);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSelectClaim = (claim: LoyaltyClaimRecord) => {
        setSelectedClaim(claim);
        setIsProcessModalOpen(true);
    };

    const handleRefresh = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    const handleToggleLoyaltyFeature = async () => {
        const nextState = !loyaltyEnabled;
        setIsTogglingFeature(true);
        try {
            const res = await toggleLoyaltyFeature(nextState);
            if (!res.success) {
                toast.error(res.error || "Failed to toggle Loyalty feature");
                return;
            }
            setLoyaltyEnabled(nextState);
            window.dispatchEvent(new CustomEvent("feature-flags-updated"));
            toast.success(
                nextState
                    ? "Loyalty & Rewards menu is now ON (Visible in User Dashboard)"
                    : "Loyalty & Rewards menu is now OFF (Hidden in User Dashboard)"
            );
            router.refresh();
        } catch {
            toast.error("Failed to toggle Loyalty feature");
        } finally {
            setIsTogglingFeature(false);
        }
    };

    const sectionTabs = [
        {
            id: "claims",
            label: "Claims Operations",
            icon: Clock,
            count: stats.pendingCount,
        },
        {
            id: "tiers",
            label: "Milestone Tiers",
            icon: Award,
            count: tiers.length,
        },
        {
            id: "analytics",
            label: "Financial Analytics",
            icon: BarChart3,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Standardized Admin Page Header */}
            <AdminPageHeader
                title="Loyalty Claims & Volume Rewards Hub"
                description="Audit trader milestone claims, verify live MT5 volume, and manage USDT cash disbursements."
            >
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTogglingFeature}
                        onClick={handleToggleLoyaltyFeature}
                        className={cn(
                            "rounded-lg h-9 px-3.5 text-xs font-bold gap-1.5 transition-all",
                            loyaltyEnabled
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                : "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                        )}
                    >
                        <Power size={14} />
                        <span>
                            Loyalty Menu: {loyaltyEnabled ? "ON" : "OFF"}
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isPending}
                        className="rounded-lg h-9 px-3.5 text-xs font-bold gap-1.5"
                    >
                        <RefreshCw
                            size={14}
                            className={cn(
                                isPending && "animate-spin text-primary"
                            )}
                        />
                        Refresh Queue
                    </Button>
                </div>
            </AdminPageHeader>

            {/* Top KPI Cards (matching sync-requests & pipeline AnimatedStatCard) */}
            <LoyaltyKpiCards stats={stats} />

            {/* Standardized Section Tab Navigation (Breek UI Guide Section 14) */}
            <Tabs
                value={activeSection}
                onValueChange={setActiveSection}
                tabsId="admin-loyalty-tabs"
            >
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 gap-1 shrink-0">
                        {sectionTabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeSection === t.id;
                            return (
                                <TabsTrigger
                                    key={t.id}
                                    value={t.id}
                                    className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                                    activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                                    activeTextClassName="!text-white"
                                >
                                    <Icon
                                        size={15}
                                        className={cn(
                                            isActive
                                                ? "text-white"
                                                : "text-gray-400 dark:text-gray-500"
                                        )}
                                    />
                                    <span>{t.label}</span>
                                    {t.count !== undefined && (
                                        <span
                                            className={cn(
                                                "text-[11px] px-2 py-0.5 rounded-lg font-mono font-bold tabular-nums transition-colors",
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                            )}
                                        >
                                            {t.count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                {/* Tab 1: Claims Operations */}
                <TabsContent value="claims" className="mt-6 space-y-6">
                    <LoyaltyClaimsTable
                        claims={claims}
                        currentStatus={statusFilter}
                        onStatusChange={setStatusFilter}
                        onSelectClaim={handleSelectClaim}
                        onRefresh={handleRefresh}
                        isRefreshing={isPending}
                    />
                </TabsContent>

                {/* Tab 2: Milestone Tiers Matrix */}
                <TabsContent value="tiers" className="mt-6 space-y-6">
                    <LoyaltyTiersMatrix
                        tiers={tiers}
                        onTiersChange={setTiers}
                    />
                </TabsContent>

                {/* Tab 3: Financial Analytics */}
                <TabsContent value="analytics" className="mt-6 space-y-6">
                    <LoyaltyAnalyticsPanel stats={stats} claims={claims} />
                </TabsContent>
            </Tabs>

            {/* Process Modal */}
            <ProcessClaimModal
                isOpen={isProcessModalOpen}
                onClose={() => setIsProcessModalOpen(false)}
                claim={selectedClaim}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
