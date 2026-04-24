'use client';

import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from './types';

interface RecentVisitor {
    sessionId: string;
    pathname: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    createdAt: string;
}

export function RecentVisitorsPanel() {
    const [visitors, setVisitors] = useState<RecentVisitor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/admin/analytics/recent');
                if (res.ok) setVisitors(await res.json());
            } catch { /* silent */ }
            finally { setLoading(false); }
        }
        load();
        const iv = setInterval(load, 30_000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Visitors</h2>
                </div>
                <span className="text-xs text-gray-400">Last 15 minutes • Auto-refreshing</span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/3" />
                                <div className="h-2 bg-gray-200 dark:bg-white/5 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : visitors.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
                                <th className="text-left pb-2 font-medium">Visitor</th>
                                <th className="text-left pb-2 font-medium">Page</th>
                                <th className="text-left pb-2 font-medium">Device</th>
                                <th className="text-right pb-2 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map((v, i) => (
                                <tr key={`${v.sessionId}-${i}`} className="border-b border-gray-50 dark:border-white/3 last:border-0 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{COUNTRY_FLAGS[v.country ?? ''] || '🌍'}</span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                {COUNTRY_NAMES[v.country ?? ''] || v.country || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2.5">
                                        <span className="text-xs text-gray-500 font-mono truncate max-w-[200px] block">{v.pathname}</span>
                                    </td>
                                    <td className="py-2.5">
                                        <span className="text-xs text-gray-400 capitalize">{v.browser} / {v.device}</span>
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <span className="text-xs text-gray-400 tabular-nums">
                                            {new Date(v.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10">
                    <Radio className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No recent visitors. Data will appear as users browse your site.</p>
                </div>
            )}
        </div>
    );
}
