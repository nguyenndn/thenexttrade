'use client';

import { useState } from 'react';
import { Globe, Map, List } from 'lucide-react';
import { COUNTRY_NAMES, COUNTRY_FLAGS } from './types';
import dynamic from 'next/dynamic';

// Lazy load WorldMap to avoid SSR issues with d3
const WorldMap = dynamic(
    () => import('./WorldMap').then(mod => ({ default: mod.WorldMap })),
    { ssr: false, loading: () => <div className="w-full h-[260px] bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" /> }
);

interface Props {
    countries: Array<{ country: string; views: number }>;
}

export function GeoPanel({ countries }: Props) {
    const [view, setView] = useState<'map' | 'table'>('map');
    const total = countries.reduce((s, c) => s + c.views, 0);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Geographic Distribution</h2>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 mr-2">{countries.length} countries</span>
                    <button
                        onClick={() => setView('map')}
                        className={`p-1.5 rounded-lg transition-colors ${view === 'map' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}
                        aria-label="Map view"
                    >
                        <Map size={14} />
                    </button>
                    <button
                        onClick={() => setView('table')}
                        className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}
                        aria-label="Table view"
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* Map View */}
            {view === 'map' && countries.length > 0 && (
                <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#12141a]">
                    <WorldMap countries={countries} />
                </div>
            )}

            {/* Country Table (always shown, scrollable) */}
            <div className={`space-y-0.5 overflow-y-auto pr-1 ${view === 'map' ? 'max-h-[200px]' : 'max-h-[400px]'}`}>
                {countries.map((c, i) => {
                    const pct = total > 0 ? Math.round((c.views / total) * 100) : 0;
                    return (
                        <div key={c.country} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                            <span className="text-xs w-5 text-center shrink-0 text-gray-400 font-mono">{i + 1}</span>
                            <span className="text-base shrink-0">{COUNTRY_FLAGS[c.country] || '🌍'}</span>
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
