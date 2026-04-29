'use client';

import { Globe } from 'lucide-react';
import { COUNTRY_NAMES, COUNTRY_FLAGS } from './types';

interface Props {
    countries: Array<{ country: string; views: number }>;
}

export function GeoPanel({ countries }: Props) {
    const total = countries.reduce((s, c) => s + c.views, 0);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Countries</h2>
                </div>
                <span className="text-xs text-gray-400">{countries.length} countries</span>
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {countries.map((c, i) => {
                    const pct = total > 0 ? Math.round((c.views / total) * 100) : 0;
                    return (
                        <div key={c.country} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                            <span className="text-sm w-6 text-center shrink-0">{i + 1}</span>
                            <span className="text-lg shrink-0">{COUNTRY_FLAGS[c.country] || '🌍'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                        {COUNTRY_NAMES[c.country] || c.country}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs text-gray-400">{pct}%</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                                            {c.views.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(pct, 1)}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
                {!countries.length && (
                    <div className="text-center py-12">
                        <Globe className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">No geo data yet. Data will appear after visitors start arriving.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
