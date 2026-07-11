import { ReportSection } from "./ReportSection";
import type { UserLifecycleReport } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";

interface UserLifecyclePanelProps {
 data: UserLifecycleReport;
}

const stageColors: Record<string, string> = {
 "Signed Up": "bg-gray-400",
 "Profile Ready": "bg-blue-400",
 "Account Connected": "bg-indigo-400",
 "First Trade": "bg-violet-500",
 "Weekly Review": "bg-purple-500",
 "Pro Candidate": "bg-amber-500",
 "Pro User": "bg-emerald-500",
 "At Risk": "bg-orange-500",
 "Churned": "bg-red-500",
};

export function UserLifecyclePanel({ data }: UserLifecyclePanelProps) {
 const maxCount = Math.max(...data.stages.map((s) => s.count), 1);

 return (
 <ReportSection
 title="User Lifecycle"
 description={`${data.totalUsers} users in selected period`}
 actionHref="/admin/users"
 actionLabel="View Users"
 >
 {/* Funnel bars */}
 <div className="space-y-2 mb-6">
 {data.stages.map((stage) => (
 <div key={stage.stage} className="flex items-center gap-3">
 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 text-right shrink-0 truncate">
 {stage.stage}
 </span>
 <div className="flex-1 h-6 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative">
 <div
 className={cn("h-full rounded-lg transition-all", stageColors[stage.stage] ?? "bg-primary")}
 style={{ width: `${Math.max((stage.count / maxCount) * 100, 2)}%` }}
 />
 <span className="absolute inset-0 flex items-center px-2 text-xs font-bold text-gray-700 dark:text-white">
 {stage.count > 0 && `${stage.count} (${stage.percent}%)`}
 </span>
 </div>
 </div>
 ))}
 </div>

 {/* Drop-off table */}
 {data.dropoffs.length > 0 && (
 <div>
 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conversion Drop-offs</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-gray-200 dark:border-white/10">
 <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">From</th>
 <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">To</th>
 <th className="px-3 py-2 text-right font-bold text-gray-400 uppercase">Drop</th>
 <th className="px-3 py-2 text-right font-bold text-gray-400 uppercase">Rate</th>
 <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Action</th>
 </tr>
 </thead>
 <tbody>
 {data.dropoffs.map((d, i) => (
 <tr key={i} className="border-b border-gray-50">
 <td className="px-3 py-2 text-gray-700 dark:text-gray-200 font-medium">{d.fromStage}</td>
 <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{d.toStage}</td>
 <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500">{d.dropCount}</td>
 <td className="px-3 py-2 text-right tabular-nums text-gray-500">{d.dropRate}%</td>
 <td className="px-3 py-2 text-gray-500">{d.suggestedAction}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </ReportSection>
 );
}
