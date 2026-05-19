import Link from "next/link";
import { ReportSection } from "./ReportSection";
import type { AlertReport } from "@/lib/admin/reports/types";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
  data: AlertReport;
}

const alertConfig = {
  critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
};

export function AlertsPanel({ data }: AlertsPanelProps) {
  if (data.alerts.length === 0) {
    return (
      <ReportSection title="Alerts">
        <div className="text-center py-6">
          <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-sm text-gray-500">No active alerts.</p>
        </div>
      </ReportSection>
    );
  }

  return (
    <ReportSection title="Alerts" description={`${data.alerts.length} active alert(s)`}>
      <div className="space-y-3">
        {data.alerts.map((alert) => {
          const cfg = alertConfig[alert.severity];
          const Icon = cfg.icon;

          return (
            <Link key={alert.id} href={alert.href} className="block">
              <div className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-colors hover:opacity-80",
                cfg.bg, cfg.border
              )}>
                <Icon size={18} className={cn(cfg.color, "shrink-0 mt-0.5")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 dark:text-white">{alert.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>Current: <strong className="text-gray-600 dark:text-gray-300">{alert.currentValue}</strong></span>
                    <span>Threshold: <strong>{alert.threshold}</strong></span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </ReportSection>
  );
}
