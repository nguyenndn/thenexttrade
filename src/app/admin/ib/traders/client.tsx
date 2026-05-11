"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  UserCheck,
  Zap,
  XCircle,
  Crown,
  Timer,
  ChevronDown,
  Search,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { revokeProAccess } from "@/actions/vip-request";
import { toast } from "sonner";

interface Trader {
  entitlementId: string;
  userId: string;
  tradingAccountId: string | null;
  userName: string;
  proStatus: string;
  proSource: string | null;
  broker: string;
  accountNumber: string;
  lastHeartbeat: string | null;
  lastTrade: string | null;
  trades30d: number;
  lotVolume30d: number;
  activityStatus: string;
  startsAt: string | null;
  expiresAt: string | null;
}

const activityStatusConfig: Record<string, { label: string; badgeClass: string; icon: any }> = {
  HIGH_VALUE_ACTIVE: {
    label: "High Value",
    badgeClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    icon: Zap,
  },
  ACTIVE_TRADER: {
    label: "Active",
    badgeClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    icon: Activity,
  },
  CONNECTED_NO_TRADES: {
    label: "No Trades",
    badgeClass: "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10",
    icon: Clock,
  },
  AT_RISK: {
    label: "At Risk",
    badgeClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    icon: AlertTriangle,
  },
  DORMANT: {
    label: "Dormant",
    badgeClass: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    icon: XCircle,
  },
  VERIFIED_INACTIVE: {
    label: "Inactive",
    badgeClass: "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-white/10",
    icon: UserCheck,
  },
  SIGNED_UP: {
    label: "Signed Up",
    badgeClass: "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-white/10",
    icon: UserCheck,
  },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TraderMonitorClient({ traders: initialTraders }: { traders: Trader[] }) {
  const [traders, setTraders] = useState(initialTraders);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [brokerFilter, setBrokerFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("trades30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Trader | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await revokeProAccess(
        deleteTarget.userId,
        "Removed from Active Trader Monitor by admin.",
        deleteTarget.tradingAccountId || undefined
      );

      if (result.success) {
        setTraders((prev) => prev.filter((trader) => trader.entitlementId !== deleteTarget.entitlementId));
        toast.success("Trader removed from monitor");
        setDeleteTarget(null);
      } else {
        toast.error(result.error || "Failed to remove trader");
      }
    });
  };

  const brokers = useMemo(() => {
    const set = new Set(traders.map((t) => t.broker));
    return ["ALL", ...Array.from(set).filter((b) => b !== "—")];
  }, [traders]);

  const filtered = useMemo(() => {
    let result = traders;
    if (statusFilter !== "ALL") result = result.filter((t) => t.activityStatus === statusFilter);
    if (brokerFilter !== "ALL") result = result.filter((t) => t.broker === brokerFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.userName.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      if (sortBy === "trades30d") return b.trades30d - a.trades30d;
      if (sortBy === "lotVolume30d") return b.lotVolume30d - a.lotVolume30d;
      if (sortBy === "lastTrade") {
        if (!a.lastTrade) return 1;
        if (!b.lastTrade) return -1;
        return new Date(b.lastTrade).getTime() - new Date(a.lastTrade).getTime();
      }
      return 0;
    });
  }, [traders, statusFilter, brokerFilter, sortBy, searchQuery]);

  const activeCount = traders.filter((t) => ["ACTIVE_TRADER", "HIGH_VALUE_ACTIVE"].includes(t.activityStatus)).length;
  const atRiskCount = traders.filter((t) => t.activityStatus === "AT_RISK").length;
  const dormantCount = traders.filter((t) => t.activityStatus === "DORMANT").length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tighter">
              Active Trader Monitor
            </h1>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-300 font-medium pl-4.5">
            {traders.length} Pro users · {activeCount} active · {atRiskCount} at risk · {dormantCount} dormant
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 justify-between">
              <span>
                Activity:{" "}
                <span className="text-primary">
                  {statusFilter === "ALL" ? "All" : activityStatusConfig[statusFilter]?.label || statusFilter}
                </span>
              </span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-xl border-gray-200 dark:border-white/10">
            <DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">
              All
            </DropdownMenuItem>
            {Object.entries(activityStatusConfig).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Broker Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 justify-between">
              <span>
                Broker:{" "}
                <span className="text-primary">
                  {brokerFilter === "ALL" ? "All" : brokerFilter}
                </span>
              </span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
            {brokers.map((b) => (
              <DropdownMenuItem key={b} onClick={() => setBrokerFilter(b)} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">
                {b === "ALL" ? "All Brokers" : b}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 justify-between">
              <span>Sort: <span className="text-primary">{sortBy === "trades30d" ? "Trades" : sortBy === "lotVolume30d" ? "Lots" : "Last Trade"}</span></span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
            <DropdownMenuItem onClick={() => setSortBy("trades30d")} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">Trades 30d</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("lotVolume30d")} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">Lot Volume</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("lastTrade")} className="font-medium cursor-pointer rounded-lg mx-1 my-0.5">Last Trade</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="flex-1 w-full sm:max-w-sm">
          <PremiumInput
            icon={Search}
            placeholder="Search user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {filtered.length} trader{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No traders match the current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-600 dark:text-gray-400 font-bold tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Broker</th>
                  <th className="px-6 py-4">Account</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4 text-right">Trades 30d</th>
                  <th className="px-6 py-4 text-right">Lots 30d</th>
                  <th className="px-6 py-4">Last Heartbeat</th>
                  <th className="px-6 py-4">Last Trade</th>
                  <th className="px-6 py-4">Pro</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((t) => {
                  const status = activityStatusConfig[t.activityStatus] || activityStatusConfig.SIGNED_UP;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={t.entitlementId} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-gray-700 dark:text-white truncate max-w-[160px]">
                          {t.userName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{t.broker}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{t.accountNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.badgeClass}`}>
                          <StatusIcon size={10} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-700 dark:text-white tabular-nums">{t.trades30d}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tabular-nums">{t.lotVolume30d.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {timeAgo(t.lastHeartbeat)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {timeAgo(t.lastTrade)}
                      </td>
                      <td className="px-6 py-4">
                        {t.proStatus === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            <Crown size={10} /> Pro
                          </span>
                        )}
                        {t.proStatus === "GRACE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                            <Timer size={10} /> Grace
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                              aria-label={`Actions for ${t.userName}`}
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-200 dark:border-white/10">
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(t)}
                              className="font-medium cursor-pointer rounded-lg mx-1 my-0.5 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete from monitor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete trader from monitor?"
        description={
          deleteTarget
            ? `This will revoke Pro access for ${deleteTarget.userName} (${deleteTarget.broker} ${deleteTarget.accountNumber}) and remove this row from Active Trader Monitor. It will not delete the user or trading account.`
            : ""
        }
        confirmText="Delete from monitor"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isPending}
        variant="danger"
      />
    </div>
  );
}
