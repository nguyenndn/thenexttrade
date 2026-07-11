import { ReportSection } from "./ReportSection";
import { severityBadgeColors as sev } from "./index";
import type { FrictionReport } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props { data: FrictionReport }

export function FrictionPanel({ data }: Props) {
 return (
 <ReportSection title="User Friction" description={`${data.totalFrictionEvents} total friction events`}>
 {data.items.length > 0 ? (
 <div className="space-y-3">
 {data.items.map((item, i) => (
 <Link key={i} href={item.href} className="block">
 <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
 <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold shrink-0", sev[item.severity])}>{item.severity}</span>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-700 dark:text-white">{item.area}</p>
 <p className="text-xs text-gray-500">{item.recommendedFix}</p>
 </div>
 <span className="text-sm font-bold text-gray-700 dark:text-white tabular-nums">{item.count}</span>
 </div>
 </Link>
 ))}
 </div>
 ) : <p className="text-center py-6 text-sm text-gray-400">No friction events tracked yet.</p>}
 </ReportSection>
 );
}
