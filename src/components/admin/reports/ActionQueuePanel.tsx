import Link from "next/link";
import { ReportSection } from "./ReportSection";
import { Button } from "@/components/ui/Button";
import type { ActionQueueReport } from "@/lib/admin/reports/types";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionQueuePanelProps {
 data: ActionQueueReport;
}

const severityConfig = {
 critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
 high: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
 medium: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
 low: { icon: CheckCircle2, color: "text-gray-400", bg: "bg-gray-50 dark:bg-white/5", border: "border-gray-200 dark:border-white/10 " },
};

export function ActionQueuePanel({ data }: ActionQueuePanelProps) {
 if (data.items.length === 0) {
 return (
 <ReportSection title="Today's Admin Queue">
 <div className="text-center py-8">
 <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
 <p className="text-sm text-gray-500">No urgent admin actions right now.</p>
 </div>
 </ReportSection>
 );
 }

 return (
 <ReportSection
 title="Today's Admin Queue"
 description={`${data.totalCritical} critical, ${data.totalHigh} high priority`}
 >
 <div className="space-y-3">
 {data.items.map((item) => {
 const cfg = severityConfig[item.severity];
 const Icon = cfg.icon;

 return (
 <div
 key={item.id}
 className={cn(
 "flex items-center gap-4 p-4 rounded-xl border transition-colors",
 cfg.bg, cfg.border
 )}
 >
 <Icon size={18} className={cn(cfg.color, "shrink-0")} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-gray-700 dark:text-white">{item.title}</span>
 <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-lg tabular-nums">
 {item.count}
 </span>
 </div>
 <p className="text-xs text-gray-500 truncate">{item.description}</p>
 </div>
 <Link href={item.href}>
 <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0">
 {item.cta}
 </Button>
 </Link>
 </div>
 );
 })}
 </div>
 </ReportSection>
 );
}
