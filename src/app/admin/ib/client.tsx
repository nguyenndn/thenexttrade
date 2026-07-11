"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Crown,
  ShieldOff,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface OverviewStats {
  totalLeads: number;
  pendingRequests: number;
  requestsInRange?: number;
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
  range: "7d" | "30d" | "all";
  overview: OverviewStats | null;
  leadStats: LeadStats | null;
  vipStats: VipStats | null;
}

const rangeOptions = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "all", label: "All time" },
] as const;

export function IbOverviewClient({ range, overview, leadStats, vipStats }: Props) {
  if (!overview || !leadStats || !vipStats) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        Unable to load IB data. Please check your admin permissions.
      </div>
    );
  }

  const rangeLabel = range === "7d" ? "last 7 days" : range === "30d" ? "last 30 days" : "all time";
  const nextActions = [
    {
      title: "Review pending Pro requests",
      description: `${overview.pendingRequests} request${overview.pendingRequests !== 1 ? "s" : ""} waiting for admin review`,
      href: "/admin/ib/pipeline",
      value: overview.pendingRequests,
      tone: "amber",
      icon: Crown,
      cta: "Open pipeline",
    },
    {
      title: "Check active Pro traders",
      description: `${overview.activeProUsers} linked Pro account${overview.activeProUsers !== 1 ? "s" : ""} currently active`,
      href: "/admin/ib/traders",
      value: overview.activeProUsers,
      tone: "cyan",
      icon: Activity,
      cta: "View traders",
    },
    {
      title: "Watch grace period users",
      description: `${overview.graceUsers} user${overview.graceUsers !== 1 ? "s" : ""} need follow-up before access expires`,
      href: "/admin/ib/traders",
      value: overview.graceUsers,
      tone: "red",
      icon: ShieldOff,
      cta: "Review risk",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-5 border-b border-gray-200 dark:border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h1 className="text-xl font-black tracking-tighter text-gray-700 dark:text-white">
              Partner Pro Operations
            </h1>
          </div>
          <p className="pl-4.5 text-base font-medium text-gray-600 dark:text-gray-300">
            Control the partner funnel from broker click to approved Pro user and real trading activity.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-1 shadow-sm">
          {rangeOptions.map((option) => (
            <Link
              key={option.value}
              href={`/admin/ib?range=${option.value}`}
              className={`rounded-lg px-4 py-2 text-xs font-black transition-colors ${
                range === option.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-2" tabsId="ib-overview-tabs">
        <div className="overflow-x-auto scrollbar-hide pb-2 flex">
          <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Lead Analytics' },
              { id: 'status', label: 'Trader Status' },
            ].map(t => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                activeTextClassName="!text-white"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-6 shadow-sm dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-[#11151F] dark:to-amber-500/10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">
                  <Sparkles size={13} />
                  North star: active Pro traders
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                    {overview.activeProUsers}
                  </p>
                  <p className="pb-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                    active now
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Use this page as the command center: review pending requests, monitor Pro activation, and spot funnel drops before revenue leaks.
                </p>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Leads</p>
                  <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{leadStats.totalLeads}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{rangeLabel}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Requests</p>
                  <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{vipStats.total}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">submitted in range</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Conversion</p>
                  <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
                    {leadStats.conversionRate.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">lead to request</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {nextActions.map((action) => {
              const Icon = action.icon;
              const toneClass =
                action.tone === "amber"
                  ? "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  : action.tone === "cyan"
                  ? "bg-cyan-50 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                  : "bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-300";

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1E2028]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`rounded-xl p-3 ring-1 ${toneClass}`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{action.value}</span>
                  </div>
                  <h2 className="mt-5 text-sm font-black text-gray-800 dark:text-white">{action.title}</h2>
                  <p className="mt-1 min-h-[40px] text-sm leading-5 text-gray-500 dark:text-gray-400">{action.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-primary">
                    {action.cta}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatedStatCard
              title="Total Leads"
              value={overview.totalLeads}
              icon={TrendingUp}
              color="blue"
              index={0}
              trendPercent={null}
            />
            <AnimatedStatCard
              title="Pending Review"
              value={overview.pendingRequests}
              icon={Clock}
              color="amber"
              index={1}
              trendPercent={null}
            />
            <AnimatedStatCard
              title="New Verified Pro"
              value={overview.verifiedUsers}
              icon={Crown}
              color="emerald"
              index={2}
              trendPercent={null}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white p-6 shadow-sm dark:bg-[#1E2028] hover:shadow-md transition-shadow group">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    Conversion Funnel
                  </h2>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Measured for {rangeLabel}
                  </p>
                </div>
                <Link href="/admin/ib/pipeline" className="inline-flex items-center gap-1 text-xs font-black text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg">
                  Review requests
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Broker Clicks", value: leadStats.totalLeads, color: "bg-blue-500" },
                  { label: "VIP Requests", value: vipStats.total, color: "bg-amber-500" },
                  { label: "Approved", value: vipStats.approved, color: "bg-emerald-500" },
                  { label: "Active Pro", value: overview.activeProUsers, color: "bg-cyan-500" },
                ].map((step) => {
                  const maxVal = Math.max(leadStats.totalLeads, 1);
                  const width = Math.max(5, Math.min(100, (step.value / maxVal) * 100));
                  return (
                    <div key={step.label}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-300">{step.label}</span>
                        <span className="font-bold text-gray-700 dark:text-white">{step.value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-[#151925] overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full ${step.color} transition-all`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {leadStats.totalLeads > 0 && (
                <div className="mt-5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Lead conversion:{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {leadStats.conversionRate.toFixed(1)}%
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white p-6 shadow-sm dark:bg-[#1E2028] hover:shadow-md transition-shadow group">
              <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-white flex items-center gap-2">
                 <Users size={18} className="text-blue-500" />
                Lead Sources
              </h2>
              {leadStats.leadsBySource.length > 0 ? (
                <div className="space-y-2">
                  {leadStats.leadsBySource.map((source) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 px-4 py-2.5 dark:bg-white/[0.02]"
                    >
                      <span className="text-sm font-medium capitalize text-gray-600 dark:text-gray-300">
                        {source.source.toLowerCase().replace("_", " ")}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white">{source.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">No leads tracked yet.</p>
              )}

              <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                By Broker
              </h3>
              {leadStats.leadsByBroker.length > 0 ? (
                <div className="space-y-2">
                  {leadStats.leadsByBroker.map((broker) => (
                    <div
                      key={broker.broker}
                      className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 px-4 py-2.5 dark:bg-white/[0.02]"
                    >
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{broker.broker}</span>
                      <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white">{broker.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">No broker clicks tracked yet.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm dark:bg-[#1E2028] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active Traders</p>
                  <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.activeProUsers}</p>
                </div>
                <div className="rounded-xl bg-cyan-50/50 p-3 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <UserCheck size={20} strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm dark:bg-[#1E2028] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Grace Period</p>
                  <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.graceUsers}</p>
                </div>
                <div className="rounded-xl bg-amber-50/50 p-3 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm dark:bg-[#1E2028] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Revoked</p>
                  <p className="mt-1 text-2xl font-black text-gray-700 dark:text-white">{overview.revokedUsers}</p>
                </div>
                <div className="rounded-xl bg-red-50/50 p-3 text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  <ShieldOff size={20} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/admin/ib/pipeline"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1E2028]"
            >
              <div className="rounded-xl bg-amber-50/50 p-2.5 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                <Crown size={18} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700 dark:text-white">VIP Pipeline</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{overview.pendingRequests} pending review</p>
              </div>
              <ArrowUpRight size={14} className="text-gray-300 transition-colors group-hover:text-amber-500 dark:text-gray-600" />
            </Link>
            <Link
              href="/admin/ib/traders"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1E2028]"
            >
              <div className="rounded-xl bg-cyan-50/50 p-2.5 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700 dark:text-white">Trader Monitor</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Activity tracking and alerts</p>
              </div>
              <ArrowUpRight size={14} className="text-gray-300 transition-colors group-hover:text-cyan-500 dark:text-gray-600" />
            </Link>
            <Link
              href="/admin/community"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1E2028]"
            >
              <div className="rounded-xl bg-gray-50/50 p-2.5 text-gray-500 ring-1 ring-gray-200 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700 dark:text-white">Legacy VIP View</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Original VIP management</p>
              </div>
              <ArrowUpRight size={14} className="text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600" />
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
