import Link from "next/link";
import { ReportSection } from "./ReportSection";
import type { ContentRoiReport } from "@/lib/admin/reports/types";
import { cn } from "@/lib/utils";

interface Props { data: ContentRoiReport }

export function ContentRoiPanel({ data }: Props) {
  return (
    <ReportSection title="Content ROI" description={`${data.totalArticleViews.toLocaleString()} article views`} actionHref="/admin/articles/ops" actionLabel="Article Ops">
      {data.attributionPartial && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
          Attribution partial — some conversion tracking events are missing.
        </div>
      )}
      {data.topArticles.length > 0 ? (
        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100 dark:border-white/5">
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Article</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Views</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Signups</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Accounts</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">Pro</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400 uppercase">ROI</th>
              <th className="px-4 py-2 text-left font-bold text-gray-400 uppercase">Issues</th>
            </tr></thead>
            <tbody>{data.topArticles.map((a) => (
              <tr key={a.articleId} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-2.5"><Link href={`/admin/articles/${a.articleId}/edit`} className="font-semibold text-gray-700 dark:text-white hover:text-primary truncate block max-w-[200px]">{a.title}</Link></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.views.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.signupAssists}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.accountAssists}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.proAssists}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-primary">{a.roiScore.toLocaleString()}</td>
                <td className="px-4 py-2.5">{a.issues.length > 0 ? a.issues.map((iss, i) => (
                  <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-red-500 bg-red-500/10 mr-1">{iss}</span>
                )) : <span className="text-gray-400">—</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="text-center py-6 text-sm text-gray-400">No content attribution data yet.</p>}
    </ReportSection>
  );
}
