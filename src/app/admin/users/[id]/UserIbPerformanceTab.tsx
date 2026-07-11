"use client";

import { format } from "date-fns";
import {
  LineChart, Users, ArrowUpRight, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Layers, FileSpreadsheet, Calendar
} from "lucide-react";

interface UserIbPerformanceTabProps {
  user: {
    id: string;
    ibLeads: Array<{
      id: string;
      broker: string;
      affiliateUrl: string | null;
      source: string;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      clickedAt: string | Date;
      convertedAt: string | Date | null;
    }>;
    ibActivitySnapshots: Array<{
      id: string;
      broker: string | null;
      accountNumberMasked: string | null;
      periodStart: string | Date;
      periodEnd: string | Date;
      tradeCount: number;
      closedLotVolume: number;
      netPnl: number;
      estimatedIbRevenue: number;
      activityStatus: string;
      lastTradeAt: string | Date | null;
    }>;
    tradingReports: Array<{
      id: string;
      type: string;
      periodStart: string | Date;
      periodEnd: string | Date;
      periodLabel: string;
      totalTrades: number;
      winCount: number;
      lossCount: number;
      winRate: number;
      netPnL: number;
    }>;
  };
}

export function UserIbPerformanceTab({ user }: UserIbPerformanceTabProps) {
  // Aggregate Stats
  const totalLeads = user.ibLeads.length;
  const convertedLeads = user.ibLeads.filter(l => l.convertedAt).length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const totalIbRevenue = user.ibActivitySnapshots.reduce((acc, curr) => acc + curr.estimatedIbRevenue, 0);
  const totalLots = user.ibActivitySnapshots.reduce((acc, curr) => acc + curr.closedLotVolume, 0);

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Affiliate Leads */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Affiliate Leads</p>
            <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1">
              {convertedLeads} <span className="text-xs font-bold text-gray-600">/ {totalLeads} clicks</span>
            </h4>
            <p className="text-[11px] text-gray-600 mt-1">
              <span className="font-bold text-blue-500">{conversionRate}%</span> conversion rate
            </p>
          </div>
        </div>

        {/* Card 2: Closed Lots */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Traded Volume</p>
            <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1">
              {totalLots.toFixed(2)} <span className="text-xs font-bold text-gray-600">Lots</span>
            </h4>
            <p className="text-[11px] text-gray-600 mt-1">
              Across registered active snapshots
            </p>
          </div>
        </div>

        {/* Card 3: Est IB Revenue */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. IB Revenue</p>
            <h4 className="text-2xl font-black text-amber-500 mt-1">
              ${totalIbRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[11px] text-gray-600 mt-1">
              Broker rebates & commissions
            </p>
          </div>
        </div>

        {/* Card 4: Reports Count */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trading Reports</p>
            <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1">
              {user.tradingReports.length} <span className="text-xs font-bold text-gray-600">Generated</span>
            </h4>
            <p className="text-[11px] text-gray-600 mt-1">
              Weekly and monthly intervals
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 1. IB Leads & Snapshots (Left 2/3), 2. Reports (Right 1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* IB Leads & Activity */}
        <div className="xl:col-span-2 space-y-6">
          {/* IB Leads table */}
          <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-primary" /> Affiliate & IB Lead Clicks
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Visits and conversions tracked via referral links</p>
            </div>

            {user.ibLeads.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                      <th className="p-3 sm:px-5">Broker</th>
                      <th className="p-3">Source & Campaign</th>
                      <th className="p-3">Clicked At</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-xs">
                    {user.ibLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/20 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 sm:px-5 font-bold text-gray-700 dark:text-white">
                          {lead.broker}
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">Route: {lead.source}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-gray-700 dark:text-white truncate max-w-[180px]">
                            {lead.utmCampaign || "Organic"}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[180px]">
                            {lead.utmSource ? `src: ${lead.utmSource}` : ""} {lead.utmMedium ? `· med: ${lead.utmMedium}` : ""}
                          </p>
                        </td>
                        <td className="p-3 text-gray-600">
                          {format(new Date(lead.clickedAt), "MMM d, yyyy · HH:mm")}
                        </td>
                        <td className="p-3 text-right">
                          {lead.convertedAt ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 font-bold">
                              <CheckCircle2 size={10} /> Converted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400 font-bold">
                              <AlertCircle size={10} /> Clicked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50/30 dark:bg-transparent">
                <p className="text-xs text-gray-600">No referral clicks logged for this user.</p>
              </div>
            )}
          </div>

          {/* IB Activity Snapshots */}
          <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                <LineChart size={16} className="text-green-500" /> Introducing Broker Activity Logs
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Historical snapshots of volume, pnl, and commission rebates</p>
            </div>

            {user.ibActivitySnapshots.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                      <th className="p-3 sm:px-5">Snapshot Period</th>
                      <th className="p-3">Trades</th>
                      <th className="p-3">Volume (Lots)</th>
                      <th className="p-3">Net PnL</th>
                      <th className="p-3 text-right">IB Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-xs">
                    {user.ibActivitySnapshots.map((snap) => (
                      <tr key={snap.id} className="hover:bg-gray-50/20 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 sm:px-5">
                          <p className="font-bold text-gray-700 dark:text-white">
                            {format(new Date(snap.periodStart), "MMM d")} - {format(new Date(snap.periodEnd), "MMM d, yyyy")}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {snap.broker} · #{snap.accountNumberMasked || "Unknown"}
                          </p>
                        </td>
                        <td className="p-3 font-medium text-gray-700 dark:text-white">
                          {snap.tradeCount} trades
                          {snap.lastTradeAt && (
                            <p className="text-[9px] text-gray-500 mt-0.5">
                              Last: {format(new Date(snap.lastTradeAt), "MMM d · HH:mm")}
                            </p>
                          )}
                        </td>
                        <td className="p-3 font-bold text-gray-700 dark:text-white">
                          {snap.closedLotVolume.toFixed(2)} lots
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${snap.netPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {snap.netPnl >= 0 ? "+" : ""}${snap.netPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-amber-500">
                          ${snap.estimatedIbRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50/30 dark:bg-transparent">
                <p className="text-xs text-gray-600">No volume snapshots recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Trading Reports */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-purple-500" /> Trading Reports
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Performance summaries compiled for the user</p>
          </div>

          {user.tradingReports.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1 overflow-y-auto max-h-[660px]">
              {user.tradingReports.map((report) => (
                <div key={report.id} className="p-4 space-y-3 hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                      {report.type}
                    </span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1 font-medium">
                      <Calendar size={11} /> {report.periodLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-200 dark:border-white/10">
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase font-medium">Trades</p>
                      <p className="font-bold text-gray-700 dark:text-white mt-0.5">{report.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase font-medium">Win Rate</p>
                      <p className="font-bold text-gray-700 dark:text-white mt-0.5">{(report.winRate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase font-medium">Net PnL</p>
                      <p className={`font-bold mt-0.5 ${report.netPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {report.netPnL >= 0 ? "+" : ""}${report.netPnL.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-600">
                    <span>
                      Wins/Losses: <span className="font-bold text-green-500">{report.winCount}</span> / <span className="font-bold text-red-500">{report.lossCount}</span>
                    </span>
                    <span>
                      {format(new Date(report.periodStart), "MMM d")} - {format(new Date(report.periodEnd), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-transparent">
              <p className="text-xs text-gray-600">No performance trading reports compiled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
