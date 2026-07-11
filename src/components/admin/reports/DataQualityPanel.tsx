import { ReportSection } from "./ReportSection";
import { severityBadgeColors as sev } from "./index";
import type { DataQualityReport } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props { data: DataQualityReport }

export function DataQualityPanel({ data }: Props) {
 const scoreColor = data.healthScore >= 80 ? "text-emerald-500" : data.healthScore >= 50 ? "text-amber-500" : "text-red-500";
 return (
 <ReportSection title="Data Quality">
 <div className="flex items-center gap-4 mb-5">
 <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
 <span className={cn("text-2xl font-black tabular-nums", scoreColor)}>{data.healthScore}</span>
 </div>
 <div>
 <p className="text-sm font-bold text-gray-700 dark:text-white">Health Score</p>
 <p className="text-xs text-gray-500">{data.issues.length} issue(s) found</p>
 </div>
 </div>
 {data.issues.length > 0 ? (
 <div className="overflow-x-auto -mx-6 md:-mx-8">
 <table className="w-full text-xs">
 <thead><tr className="border-b border-gray-200 dark:border-white/10">
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Group</th>
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Issue</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Count</th>
 <th className="px-4 py-2 text-center font-bold text-gray-400 uppercase">Severity</th>
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Fix</th>
 </tr></thead>
 <tbody>{data.issues.map((iss, i) => (
 <tr key={i} className="border-b border-gray-50">
 <td className="px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300">{iss.group}</td>
 <td className="px-4 py-2.5 text-gray-700 dark:text-white">{iss.issue}</td>
 <td className="px-4 py-2.5 text-right tabular-nums font-bold">{iss.count}</td>
 <td className="px-4 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-lg font-bold", sev[iss.severity])}>{iss.severity}</span></td>
 <td className="px-4 py-2.5"><Link href={iss.href} className="text-primary hover:underline">{iss.suggestedFix}</Link></td>
 </tr>
 ))}</tbody>
 </table>
 </div>
 ) : <p className="text-center py-6 text-sm text-gray-400">No data quality issues found.</p>}
 </ReportSection>
 );
}
