"use client";

import { Activity, ServerCrash, Cpu, ArrowUpRight, BarChart3, CheckCircle2, XCircle, Clock, Coins } from "lucide-react";
import Link from "next/link";
 
export function AiGatewayOverview({ stats }: { stats: any }) {
  const successCount = stats.requestsByStatus.find((s: any) => s.status === 'COMPLETED')?._count || 0;
  const errorCount = stats.requestsByStatus.find((s: any) => s.status === 'ERROR')?._count || 0;
  
  const successRate = stats.totalRequestsToday > 0 
    ? Math.round((successCount / stats.totalRequestsToday) * 100) 
    : 100;
 
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Requests Today</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalRequestsToday}</div>
        </div>
 
        {/* Success Rate */}
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-semibold">Success Rate</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{successRate}%</div>
            <div className="text-xs text-red-500 dark:text-red-400 font-semibold">{errorCount} errors</div>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-semibold">Avg Latency</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{stats.avgLatency ? Math.round(stats.avgLatency) : 0}ms</div>
        </div>
 
        {/* Total Cost */}
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
            <Coins className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-semibold">Total Cost Today</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
            ${stats.totalCostToday ? stats.totalCostToday.toFixed(4) : "0.0000"}
          </div>
        </div>
      </div>
 
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/ai/providers" className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Providers & Models</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage API keys and model limits</p>
        </Link>
        
        <Link href="/admin/ai/routes" className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-500">
              <ServerCrash className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Routing Policies</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Configure fallback chains</p>
        </Link>
        
        <Link href="/admin/ai/requests" className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Requests Explorer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">View logs, attempts, and costs</p>
        </Link>
      </div>

      {/* Provider Health */}
      <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Provider Health Status</h3>
        <div className="space-y-3">
          {stats.providers.map((p: any) => (
            <div key={p.providerCode} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10">
              <span className="text-gray-900 dark:text-white font-medium">{p.displayName}</span>
              <div className="flex items-center gap-2">
                {p.healthStatus === 'HEALTHY' ? (
                  <Badge text="Healthy" icon={<CheckCircle2 className="w-3 h-3 mr-1" />} color="green" />
                ) : p.healthStatus === 'DEGRADED' ? (
                  <Badge text="Degraded" icon={<Activity className="w-3 h-3 mr-1" />} color="yellow" />
                ) : (
                  <Badge text="Unknown" icon={<XCircle className="w-3 h-3 mr-1" />} color="gray" />
                )}
              </div>
            </div>
          ))}
          {stats.providers.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No providers configured</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ text, icon, color }: { text: string; icon?: React.ReactNode; color: 'green'|'yellow'|'red'|'gray' }) {
  const colors = {
    green: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500",
    red: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500",
    gray: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${colors[color]}`}>
      {icon}
      {text}
    </span>
  );
}
