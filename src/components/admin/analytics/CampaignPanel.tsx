'use client';

import { Megaphone } from 'lucide-react';

interface Campaign {
 campaign: string;
 source: string;
 medium: string;
 views: number;
 uniqueVisitors: number;
}

interface Props {
 campaigns: Campaign[];
 totalViews: number;
 loading?: boolean;
}

export function CampaignPanel({ campaigns, totalViews, loading }: Props) {
 if (loading) {
 return (
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 animate-pulse">
 <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/4 mb-4" />
 <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-white/5 rounded" />)}</div>
 </div>
 );
 }

 if (!campaigns.length) {
 return (
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center gap-2 mb-4">
 <Megaphone className="w-4 h-4 text-amber-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">Campaign Tracking</h2>
 </div>
 <div className="text-center py-8">
 <Megaphone className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
 <p className="text-sm text-gray-400 mb-1">No campaign data yet</p>
 <p className="text-xs text-gray-400">
 Add <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded text-[10px]">?utm_source=...&utm_campaign=...</code> to your URLs
 </p>
 </div>
 </div>
 );
 }

 const maxViews = campaigns[0]?.views ?? 1;

 return (
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Megaphone className="w-4 h-4 text-amber-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">Campaign Tracking</h2>
 </div>
 <span className="text-xs text-gray-400">{totalViews.toLocaleString()} total views</span>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">
 <th className="text-left pb-2 font-medium">Campaign</th>
 <th className="text-left pb-2 font-medium">Source</th>
 <th className="text-left pb-2 font-medium">Medium</th>
 <th className="text-right pb-2 font-medium">Views</th>
 <th className="text-right pb-2 font-medium">Visitors</th>
 </tr>
 </thead>
 <tbody>
 {campaigns.map((c, idx) => {
 const pct = Math.round((c.views / maxViews) * 100);
 return (
 <tr key={`${c.campaign}-${c.source}-${idx}`}
 className="border-b border-gray-50 dark:border-white/3 last:border-0 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
 <td className="py-2.5">
 <div className="flex items-center gap-1.5">
 <div className="w-1 h-4 rounded-full bg-amber-500" style={{ opacity: 0.3 + (pct / 100) * 0.7 }} />
 <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
 {c.campaign}
 </span>
 </div>
 </td>
 <td className="py-2.5">
 <span className="text-xs text-gray-500 dark:text-gray-400">{c.source}</span>
 </td>
 <td className="py-2.5">
 <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-white/5 text-gray-500">
 {c.medium}
 </span>
 </td>
 <td className="py-2.5 text-right">
 <span className="text-xs font-bold text-gray-900 dark:text-white">{c.views.toLocaleString()}</span>
 </td>
 <td className="py-2.5 text-right">
 <span className="text-xs text-gray-500">{c.uniqueVisitors.toLocaleString()}</span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
}
