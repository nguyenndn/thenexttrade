'use client';

import { FileText } from 'lucide-react';

interface Props {
    pages: Array<{ pathname: string; views: number }>;
}

export function TopPagesPanel({ pages }: Props) {
    const maxViews = pages[0]?.views ?? 1;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-cyan-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Pages</h2>
            </div>

            {/* Table header */}
            <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-white/5 mb-2">
                <span>Page</span>
                <span>Views</span>
            </div>

            <div className="space-y-0.5 max-h-[350px] overflow-y-auto">
                {pages.map(p => {
                    const pct = Math.round((p.views / maxViews) * 100);
                    return (
                        <div key={p.pathname} className="relative group">
                            {/* Background bar */}
                            <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/5 rounded-md transition-all"
                                style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between py-2.5 px-3">
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[75%] font-mono text-xs">
                                    {p.pathname}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {p.views.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {!pages.length && <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
            </div>
        </div>
    );
}
