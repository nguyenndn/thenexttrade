"use client";

import {
  TrendingUp,
  Users,
  Crown,
  Clock,
  Activity,
  ArrowUpRight,
  UserCheck,
  ShieldOff,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";

interface OverviewStats {
  totalLeads: number;
  pendingRequests: number;
  verifiedUsers: number;
  activeProUsers: number;
  graceUsers: number;
  revokedUsers: number;
}

interface LeadStats {
  totalLeads: number;
  leads30d: number;
  leads7d: number;
  convertedLeads: number;
  conversionRate: number;
  leadsByBroker: Array<{ broker: string; count: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
}

interface VipStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Props {
  overview: OverviewStats | null;
  leadStats: LeadStats | null;
  vipStats: VipStats | null;
}

export function IbOverviewClient({ overview, leadStats, vipStats }: Props) {
  if (!overview || !leadStats || !vipStats) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        Unable to load IB data. Please check your admin permissions.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tighter">
              IB Overview
            </h1>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-300 font-medium pl-4.5">
            Track your IB funnel: Leads → VIP Requests → Verified → Active Traders
          </p>
        </div>
      </div>

      {/* Hero Stats — using existing AnimatedStatCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatedStatCard
          title="Total Leads"
          value={overview.totalLeads}
          icon={TrendingUp}
          color="blue"
          index={0}
          trendPercent={null}
        />
        <AnimatedStatCard
          title="Pending VIP"
          value={overview.pendingRequests}
          icon={Clock}
          color="amber"
          index={1}
          trendPercent={null}
        />
        <AnimatedStatCard
          title="Verified Pro"
          value={overview.verifiedUsers}
          icon={Crown}
          color="emerald"
          index={2}
          trendPercent={null}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Traders</p>
              <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.activeProUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20">
              <UserCheck size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grace Period</p>
              <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.graceUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
              <Activity size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revoked</p>
              <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.revokedUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
              <ShieldOff size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel + Leads by Source */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider mb-5">
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            {[
              { label: "Broker Clicks", value: leadStats.totalLeads, color: "bg-blue-500" },
              { label: "VIP Requests", value: vipStats.total, color: "bg-amber-500" },
              { label: "Approved", value: vipStats.approved, color: "bg-emerald-500" },
              { label: "Active Pro", value: overview.activeProUsers, color: "bg-cyan-500" },
            ].map((step, i) => {
              const maxVal = Math.max(leadStats.totalLeads, 1);
              const width = Math.max(5, (step.value / maxVal) * 100);
              return (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{step.label}</span>
                    <span className="font-bold text-gray-700 dark:text-white">{step.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/5">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {leadStats.totalLeads > 0 && (
            <div className="mt-5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 px-4 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall Conversion:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {leadStats.conversionRate.toFixed(1)}%
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Leads by Source + Broker */}
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider mb-5">
            Leads by Source
          </h2>
          {leadStats.leadsBySource.length > 0 ? (
            <div className="space-y-2">
              {leadStats.leadsBySource.map((s) => (
                <div
                  key={s.source}
                  className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                    {s.source.toLowerCase().replace("_", " ")}
                  </span>
                  <span className="font-bold text-sm text-gray-700 dark:text-white tabular-nums">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No leads tracked yet.</p>
          )}

          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-3">
            By Broker
          </h3>
          {leadStats.leadsByBroker.length > 0 ? (
            <div className="space-y-2">
              {leadStats.leadsByBroker.map((b) => (
                <div
                  key={b.broker}
                  className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{b.broker}</span>
                  <span className="font-bold text-sm text-gray-700 dark:text-white tabular-nums">
                    {b.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No broker clicks tracked yet.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/ib/pipeline"
          className="group bg-white dark:bg-[#1E2028] flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-500/20"
        >
          <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
            <Crown size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-700 dark:text-white">VIP Pipeline</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {overview.pendingRequests} pending review
            </p>
          </div>
          <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-amber-500 transition-colors" />
        </Link>
        <Link
          href="/admin/ib/traders"
          className="group bg-white dark:bg-[#1E2028] flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-cyan-200 dark:hover:border-cyan-500/20"
        >
          <div className="p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-700 dark:text-white">Trader Monitor</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Activity tracking & alerts</p>
          </div>
          <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-cyan-500 transition-colors" />
        </Link>
        <Link
          href="/admin/community"
          className="group bg-white dark:bg-[#1E2028] flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-white/20"
        >
          <div className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-white/10">
            <Users size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-700 dark:text-white">Legacy VIP View</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Original VIP management</p>
          </div>
          <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
