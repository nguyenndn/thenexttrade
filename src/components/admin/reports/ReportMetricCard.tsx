import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportMetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  trendPercent?: number | null;
  tone?: "default" | "good" | "warning" | "danger";
  href?: string;
}

const toneColors = {
  default: "text-gray-800 dark:text-white",
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

const toneBg = {
  default: "bg-gray-50 dark:bg-white/5",
  good: "bg-emerald-50 dark:bg-emerald-500/10",
  warning: "bg-amber-50 dark:bg-amber-500/10",
  danger: "bg-red-50 dark:bg-red-500/10",
};

export function ReportMetricCard({ label, value, helper, trendPercent, tone = "default", href }: ReportMetricCardProps) {
  const content = (
    <div className={cn(
      "rounded-xl border border-gray-200 dark:border-white/10 p-4 transition-all",
      toneBg[tone],
      href && "hover:border-primary/30 cursor-pointer"
    )}>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className={cn("text-2xl font-bold tabular-nums", toneColors[tone])}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {trendPercent !== null && trendPercent !== undefined && (
          <span className={cn(
            "flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-lg mb-0.5",
            trendPercent > 0 ? "text-emerald-600 bg-emerald-500/10" :
            trendPercent < 0 ? "text-red-500 bg-red-500/10" :
            "text-gray-500 bg-gray-500/10"
          )}>
            {trendPercent > 0 ? <TrendingUp size={12} /> : trendPercent < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trendPercent)}%
          </span>
        )}
      </div>
      {helper && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helper}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
