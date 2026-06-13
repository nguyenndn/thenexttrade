import { ReportSection } from "./ReportSection";
import { ReportMetricCard } from "./ReportMetricCard";
import type { UserQualityReport, UserQualityRow } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";

interface UserQualityPanelProps {
 data: UserQualityReport;
}

const bandColors: Record<string, string> = {
 "High Quality": "text-emerald-600 bg-emerald-500/10",
 "Warm": "text-blue-600 bg-blue-500/10",
 "Low Intent": "text-amber-600 bg-amber-500/10",
 "Empty Signup": "text-gray-500 bg-gray-500/10",
};

export function UserQualityPanel({ data }: UserQualityPanelProps) {
 return (
 <ReportSection
 title="User Quality"
 description={`${data.newUsers} new users in period`}
 actionHref="/admin/users"
 actionLabel="View All Users"
 >
 {/* Metric cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
 <ReportMetricCard
 label="Quality Score"
 value={data.averageScore}
 helper="Average 0-100"
 tone={data.averageScore >= 60 ? "good" : data.averageScore >= 40 ? "warning" : "danger"}
 />
 <ReportMetricCard label="With Account" value={data.usersWithAccount} />
 <ReportMetricCard label="Real Account" value={data.realAccountUsers} tone="good" />
 <ReportMetricCard label="Inactive 24h" value={data.inactiveAfterSignup} tone={data.inactiveAfterSignup > 10 ? "warning" : "default"} />
 </div>

 {/* User table */}
 {data.topUsers.length > 0 ? (
 <div className="overflow-x-auto -mx-6 md:-mx-8">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-dashboard">
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">User</th>
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Country</th>
 <th className="px-4 py-2 text-center font-bold text-gray-400 uppercase">Band</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Score</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Accounts</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Trades</th>
 <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Balance</th>
 <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Action</th>
 </tr>
 </thead>
 <tbody>
 {data.topUsers.map((user) => (
 <UserRow key={user.id} user={user} />
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="text-center py-6 text-sm text-gray-400">No new users in this period.</p>
 )}
 </ReportSection>
 );
}

function UserRow({ user }: { user: UserQualityRow }) {
 return (
 <tr className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
 <td className="px-4 py-2.5">
 <p className="font-semibold text-gray-700 dark:text-white truncate max-w-[160px]">{user.name || "—"}</p>
 <p className="text-gray-400 truncate max-w-[160px]">{user.email || ""}</p>
 </td>
 <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{user.country || "—"}</td>
 <td className="px-4 py-2.5 text-center">
 <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold", bandColors[user.qualityBand])}>
 {user.qualityBand}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right tabular-nums font-bold text-gray-700 dark:text-white">{user.qualityScore}</td>
 <td className="px-4 py-2.5 text-right tabular-nums">{user.accountCount}</td>
 <td className="px-4 py-2.5 text-right tabular-nums">{user.tradeJournalCount}</td>
 <td className="px-4 py-2.5 text-right tabular-nums font-medium">${user.balance.toLocaleString()}</td>
 <td className="px-4 py-2.5 text-gray-500">{user.recommendedAction}</td>
 </tr>
 );
}
