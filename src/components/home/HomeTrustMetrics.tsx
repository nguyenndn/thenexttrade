"use client";

import { BookOpen, GraduationCap, Link2, Activity, ClipboardList } from "lucide-react";

interface TrustMetricsProps {
  metrics: {
    tradingGuides: number;
    academyLessons: number;
    connectedAccounts: number;
    syncedTrades: number;
    coachReports: number;
  };
}

export function HomeTrustMetrics({ metrics }: TrustMetricsProps) {
  const items = [
    {
      label: "Trading Guides",
      value: metrics.tradingGuides,
      icon: <BookOpen size={18} strokeWidth={2.4} />,
      color: "text-gold",
      bg: "bg-gold/10",
      border: "border-gold/20",
    },
    {
      label: "Academy Lessons",
      value: metrics.academyLessons,
      icon: <GraduationCap size={18} strokeWidth={2.4} />,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Connected Accounts",
      value: metrics.connectedAccounts,
      icon: <Link2 size={18} strokeWidth={2.4} />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Synced Trades",
      value: metrics.syncedTrades > 10000 ? `${(metrics.syncedTrades / 1000).toFixed(0)}k+` : metrics.syncedTrades,
      icon: <Activity size={18} strokeWidth={2.4} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Coach Reports",
      value: metrics.coachReports,
      icon: <ClipboardList size={18} strokeWidth={2.4} />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  // Filter out metrics with 0 value to keep page looking strong
  const activeItems = items.filter(item => typeof item.value === 'number' ? item.value > 0 : !!item.value);

  if (activeItems.length === 0) return null;

  const colMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };
  const gridColsClass = colMap[activeItems.length] || "md:grid-cols-5";

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-transparent">
      <section className="mx-auto max-w-6xl px-4 pt-2 pb-10 sm:px-6 sm:pb-12 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/80 p-2 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] dark:border-white/[0.07] dark:bg-white/[0.018] sm:p-0">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.055),transparent_34%,rgba(16,185,129,0.045)_72%,transparent)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

          <div className={`relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-y-0 sm:divide-gray-200/70 sm:[&>*:nth-child(2n+1)]:border-l-0 ${gridColsClass} md:divide-x dark:sm:divide-white/[0.07]`}>
            {activeItems.map((item, idx) => {
              const isLastOddItem = activeItems.length % 2 === 1 && idx === activeItems.length - 1;

              return (
                <div
                  key={idx}
                  className={`group relative flex min-h-[92px] flex-col justify-between gap-3 rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-3 transition-colors duration-300 hover:bg-gray-50/80 dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:bg-white/[0.04] sm:min-h-[86px] sm:flex-row sm:items-center sm:rounded-none sm:border-0 sm:bg-transparent sm:px-5 sm:py-4 sm:text-left sm:hover:bg-gray-50/70 sm:dark:bg-transparent sm:dark:hover:bg-white/[0.025] sm:justify-start md:px-6 ${
                    isLastOddItem
                      ? "col-span-2 items-center text-center sm:col-span-1"
                      : "items-start text-left"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 dark:text-gray-300 sm:text-[10px] sm:tracking-[0.16em]">
                      {item.label}
                    </span>
                    <span className="mt-1.5 block text-lg font-black leading-none tracking-tight text-gray-900 dark:text-white sm:text-xl">
                      {typeof item.value === 'number' ? item.value.toLocaleString('en-US') : item.value}
                    </span>
                  </div>

                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.border} ${item.bg} transition-transform duration-300 sm:h-11 sm:w-11 sm:rounded-2xl`}>
                    <span className={`${item.color} block transition-transform duration-300 group-hover:scale-110`}>
                      {item.icon}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
