import Link from "next/link";
import type { NorthStarReport } from "@/lib/admin/reports/types";
import {
  Users,
  Wallet,
  BookOpen,
  FileText,
  Crown,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NorthStarPanelProps {
  data: NorthStarReport;
}

const funnelSteps = [
  { key: "newUsers", label: "New Users", icon: Users, color: "text-blue-600", bg: "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" },
  { key: "connectedAccountUsers", label: "Connected", icon: Wallet, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20" },
  { key: "firstTradeUsers", label: "First Trade", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
  { key: "weeklyReportUsers", label: "Weekly Rep", icon: FileText, color: "text-amber-600", bg: "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20" },
  { key: "proRequestUsers", label: "Pro Req", icon: Crown, color: "text-orange-600", bg: "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20" },
  { key: "proUnlockedUsers", label: "Pro Active", icon: Zap, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
] as const;

export function NorthStarPanel({ data }: NorthStarPanelProps) {
  const isPositive = data.trendPct > 0;
  const isNegative = data.trendPct < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const activationRate =
    data.newUsers > 0
      ? Math.round((data.proUnlockedUsers / data.newUsers) * 100)
      : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#fbfffd_52%,#fff8ea_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#121722_0%,#111827_56%,#17120a_100%)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10b981,#38bdf8,#f59e0b)]" />

      <div className="relative p-5 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.55)]" />
              North Star
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-3">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  Weekly active traders
                </p>
                <p className="mt-1 text-6xl font-black leading-none tracking-tight text-gray-950 tabular-nums dark:text-white">
                  {data.activeTraders.toLocaleString()}
                </p>
              </div>

              <span className={cn(
                "mb-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-black tabular-nums",
                isPositive && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                isNegative && "bg-red-500/15 text-red-700 dark:text-red-300",
                !isPositive && !isNegative && "bg-gray-500/15 text-gray-700 dark:text-gray-300",
              )}>
                <TrendIcon size={16} />
                {isPositive ? "+" : ""}{data.trendPct}%
              </span>

              <div className="mb-1 border-l border-gray-200 pl-5 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Previous
                </p>
                <p className="mt-0.5 text-lg font-black text-gray-900 tabular-nums dark:text-white">
                  {data.previousActiveTraders.toLocaleString()}
                </p>
              </div>

              <div className="mb-1 border-l border-gray-200 pl-5 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Pro activation
                </p>
                <p className="mt-0.5 text-lg font-black text-amber-700 tabular-nums dark:text-amber-300">
                  {activationRate}%
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
          >
            View Users
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-7 border-t border-gray-200 pt-5 dark:border-white/10">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-amber-600" />
                <h2 className="text-base font-black text-gray-950 dark:text-white">
                  Weekly Active Traders Funnel
                </h2>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                From signup to Pro activation, measured across the selected report window.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {data.proUnlockedUsers.toLocaleString()} of {data.newUsers.toLocaleString()} users reached Pro Active
            </span>
          </div>

          <div className="mt-5 grid min-w-0 grid-cols-1 border-y border-gray-200 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {funnelSteps.map((step, i) => {
              const value = data[step.key];
              const prevValue = i > 0 ? data[funnelSteps[i - 1].key] : null;
              const convRate = prevValue && prevValue > 0 ? Math.round((value / prevValue) * 100) : null;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className="group min-w-0 border-b border-gray-200 p-4 transition-colors last:border-b-0 hover:bg-white/70 dark:border-white/10 dark:hover:bg-white/[0.03] sm:border-r sm:last:border-r-0 2xl:border-b-0"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm",
                      step.bg
                    )}>
                      <Icon size={19} className={step.color} />
                    </div>
                    {convRate !== null && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 tabular-nums dark:bg-emerald-500/10 dark:text-emerald-300">
                        {convRate}%
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-black leading-none text-gray-950 tabular-nums dark:text-white">
                    {value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    {step.label}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#f59e0b)]"
                      style={{
                        width: `${Math.max(8, Math.min(100, i === 0 ? 100 : convRate ?? 0))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <span>
              Pro activation rate is calculated as Pro Active divided by New Users for this period.
            </span>
            <span className="font-black text-amber-700 dark:text-amber-300">
              {activationRate}% activation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
