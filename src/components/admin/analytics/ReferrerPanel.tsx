'use client';

import { Link2 } from 'lucide-react';

interface Props {
    referrers: Array<{ referrer: string; views: number }>;
}

export function ReferrerPanel({ referrers }: Props) {
    const maxViews = referrers[0]?.views ?? 1;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center gap-2 mb-5">
                <Link2 className="w-4 h-4 text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Referrers</h2>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-white/5 mb-2">
                <span>Source</span>
                <span>Visitors</span>
            </div>

            <div className="space-y-0.5 max-h-[350px] overflow-y-auto">
                {referrers.map(r => {
                    let domain = r.referrer;
                    try { domain = new URL(r.referrer).hostname.replace('www.', ''); } catch {}
                    const pct = Math.round((r.views / maxViews) * 100);
                    return (
                        <div key={r.referrer} className="relative group">
                            <div className="absolute inset-0 bg-purple-50 dark:bg-purple-500/5 rounded-md transition-all"
                                style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between py-2.5 px-3">
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[75%]">{domain}</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.views.toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
                {!referrers.length && <p className="text-sm text-gray-400 text-center py-8">No referrer data yet</p>}
            </div>
        </div>
    );
}
