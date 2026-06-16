"use client";

import { CheckCircle, AlertTriangle, XCircle, Info, Activity } from "lucide-react";

interface SyncHealthSummaryCardProps {
  summary: {
    totalAccounts: number;
    healthy: number;
    needsAttention: number;
    neverSynced: number;
    stale: number;
    disconnected: number;
  };
}

export function SyncHealthSummaryCard({ summary }: SyncHealthSummaryCardProps) {
  const items = [
    {
      label: "Healthy",
      count: summary.healthy,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Needs Attention",
      count: summary.needsAttention,
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Never Synced",
      count: summary.neverSynced,
      icon: Info,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#151925] border border-dashboard/80 dark:border-white/[0.08] shadow-sm">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Activity size={20} />
        </div>
        <div>
          <p className="text-[11px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">Total Accounts</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{summary.totalAccounts}</p>
        </div>
      </div>

      {/* Metric Cards */}
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#151925] border border-dashboard/80 dark:border-white/[0.08] shadow-sm`}
          >
            <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">{item.label}</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{item.count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
