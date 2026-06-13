import { ReportSection } from "./ReportSection";
import type { FeatureAdoptionReport } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";

interface Props { data: FeatureAdoptionReport }

const statusColors = { Tracked: "text-emerald-600 bg-emerald-500/10", Partial: "text-amber-600 bg-amber-500/10", Missing: "text-gray-500 bg-gray-500/10" };

export function FeatureAdoptionPanel({ data }: Props) {
 return (
 <ReportSection title="Feature Adoption" description={`${data.totalActiveUsers} active users in period`}>
 {data.features.length > 0 ? (
 <div className="overflow-x-auto -mx-6 md:-mx-8">
 <table className="w-full text-xs">
 <thead><tr className="border-b border-dashboard">
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Feature</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Users</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Actions</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Adoption</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Trend</th>
 <th className="px-4 py-2 text-center font-bold text-gray-400 uppercase">Status</th>
 </tr></thead>
 <tbody>{data.features.map((f) => (
 <tr key={f.feature} className="border-b border-gray-50">
 <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-white">{f.feature}</td>
 <td className="px-4 py-2.5 text-right tabular-nums">{f.users.toLocaleString()}</td>
 <td className="px-4 py-2.5 text-right tabular-nums">{f.actions.toLocaleString()}</td>
 <td className="px-4 py-2.5 text-right tabular-nums font-bold">{f.adoptionRate}%</td>
 <td className="px-4 py-2.5 text-right tabular-nums">
 {f.trendPct !== null ? (
 <span className={f.trendPct > 0 ? "text-emerald-600" : f.trendPct < 0 ? "text-red-500" : "text-gray-400"}>
 {f.trendPct > 0 ? "+" : ""}{f.trendPct}%
 </span>
 ) : "—"}
 </td>
 <td className="px-4 py-2.5 text-center">
 <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold", statusColors[f.trackingStatus])}>{f.trackingStatus}</span>
 </td>
 </tr>
 ))}</tbody>
 </table>
 </div>
 ) : <p className="text-center py-6 text-sm text-gray-400">No feature data available.</p>}
 </ReportSection>
 );
}
