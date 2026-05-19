import { ReportSection } from "./ReportSection";
import { ReportMetricCard } from "./ReportMetricCard";
import type { RevenueOpportunityReport } from "@/lib/admin/reports/types";

interface Props { data: RevenueOpportunityReport }

export function RevenueOpportunityPanel({ data }: Props) {
  return (
    <ReportSection title="Revenue Opportunities" actionHref="/admin/ib/pipeline" actionLabel="VIP Pipeline">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <ReportMetricCard label="Pro Users" value={data.proUsers} tone="good" />
        <ReportMetricCard label="Candidates" value={data.proCandidates} tone="warning" />
        <ReportMetricCard label="Pending" value={data.pendingProRequests} tone={data.pendingProRequests > 0 ? "warning" : "default"} href="/admin/ib/pipeline" />
        <ReportMetricCard label="Est. IB Revenue" value={data.estimatedIbRevenue !== null ? `$${Math.round(data.estimatedIbRevenue).toLocaleString()}` : "N/A"} />
      </div>
      {data.opportunities.length > 0 ? (
        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100 dark:border-white/5">
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">User</th>
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Broker</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Balance</th>
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Reason</th>
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody>{data.opportunities.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 dark:border-white/5">
                <td className="px-4 py-2.5"><p className="font-semibold text-gray-700 dark:text-white truncate max-w-[140px]">{o.name || "—"}</p></td>
                <td className="px-4 py-2.5 text-gray-600">{o.broker || "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold">${o.balance.toLocaleString()}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-500/10">{o.opportunityReason}</span></td>
                <td className="px-4 py-2.5 text-primary font-semibold">{o.suggestedAction}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="text-center py-6 text-sm text-gray-400">No Pro opportunities found for this period.</p>}
    </ReportSection>
  );
}
