"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  LoyaltyClaimRecord,
  LoyaltyClaimStatus,
  LoyaltyTierItem,
} from "@/lib/loyalty/loyalty.types";
import type { AdminLoyaltyStats } from "@/actions/admin/loyalty";
import { LoyaltyKpiCards } from "./LoyaltyKpiCards";
import { LoyaltyClaimsTable } from "./LoyaltyClaimsTable";
import { LoyaltyTiersMatrix } from "./LoyaltyTiersMatrix";
import { LoyaltyAnalyticsPanel } from "./LoyaltyAnalyticsPanel";
import { ProcessClaimModal } from "./ProcessClaimModal";
import { Crown, RefreshCw, Clock, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface AdminLoyaltyClientProps {
  initialClaims: LoyaltyClaimRecord[];
  initialStats: AdminLoyaltyStats;
  initialTiers: LoyaltyTierItem[];
}

export function AdminLoyaltyClient({
  initialClaims,
  initialStats,
  initialTiers,
}: AdminLoyaltyClientProps) {
  const router = useRouter();
  const [claims] = useState<LoyaltyClaimRecord[]>(initialClaims);
  const [stats] = useState<AdminLoyaltyStats>(initialStats);
  const [tiers] = useState<LoyaltyTierItem[]>(initialTiers);
  const [statusFilter, setStatusFilter] = useState<LoyaltyClaimStatus | "ALL">("ALL");
  const [selectedClaim, setSelectedClaim] = useState<LoyaltyClaimRecord | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const asOfTimestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleSelectClaim = (claim: LoyaltyClaimRecord) => {
    setSelectedClaim(claim);
    setIsProcessModalOpen(true);
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header matching admin/ib standard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Crown size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              IB & VIP Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Loyalty Claims & Volume Rewards Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Audit trader milestone claims, verify live MT5 volume, and manage USDT cash disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="rounded-lg h-9 px-3.5 text-xs font-bold gap-1.5"
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Meta Row (matching admin/ib standard) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">As of {asOfTimestamp}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-gray-500 dark:text-gray-400">Live MT5 Telemetry</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">
            {tiers.length} Milestone Tiers Active
          </span>
        </div>
      </div>

      {/* Top KPI Cards (matching admin/ib card specs) */}
      <LoyaltyKpiCards stats={stats} />

      {/* Standardized Tab Navigation (Breek UI Guide Section 14) */}
      <Tabs defaultValue="claims" className="mt-2" tabsId="admin-loyalty-tabs">
        <div className="overflow-x-auto scrollbar-hide flex">
          <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 gap-1 shrink-0">
            {[
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
              },
              {
                id: "analytics",
                label: "Financial Analytics",
                icon: BarChart3,
              },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 flex items-center gap-2"
                  activeIndicatorClassName="!bg-gold shadow-md shadow-amber-500/20 border-0"
                  activeTextClassName="!text-white font-bold"
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black ml-1">
                      {t.count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab 1: Claims Operations */}
        <TabsContent
          value="claims"
          className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <LoyaltyClaimsTable
            claims={claims}
            currentStatus={statusFilter}
            onStatusChange={setStatusFilter}
            onSelectClaim={handleSelectClaim}
          />
        </TabsContent>

        {/* Tab 2: Milestone Tiers Matrix */}
        <TabsContent
          value="tiers"
          className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <LoyaltyTiersMatrix tiers={tiers} />
        </TabsContent>

        {/* Tab 3: Financial Analytics */}
        <TabsContent
          value="analytics"
          className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
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
