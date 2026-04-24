'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { AnalyticsSummary } from '@/components/admin/analytics/AnalyticsSummary';
import { PageviewTrend } from '@/components/admin/analytics/PageviewTrend';
import { GeoPanel } from '@/components/admin/analytics/GeoPanel';
import { TopPagesPanel } from '@/components/admin/analytics/TopPagesPanel';
import { TechPanel } from '@/components/admin/analytics/TechPanel';
import { ReferrerPanel } from '@/components/admin/analytics/ReferrerPanel';
import { FunnelPanel } from '@/components/admin/analytics/FunnelPanel';
import { EventsPanel } from '@/components/admin/analytics/EventsPanel';
import { RecentVisitorsPanel } from '@/components/admin/analytics/RecentVisitorsPanel';
import type { AnalyticsData, EventsData } from '@/components/admin/analytics/types';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'audience', label: 'Audience' },
    { id: 'events', label: 'Events' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
    const [tab, setTab] = useState<TabId>('overview');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [eventsData, setEventsData] = useState<EventsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [realTime, setRealTime] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [aRes, eRes] = await Promise.all([
                fetch(`/api/admin/analytics?period=${period}`),
                fetch(`/api/admin/analytics/events?period=${period}`),
            ]);
            if (aRes.ok) { const d = await aRes.json(); setData(d); setRealTime(d.summary.realTimeVisitors); }
            else { console.error('Analytics API error:', aRes.status, await aRes.text()); }
            if (eRes.ok) { setEventsData(await eRes.json()); }
            else { console.error('Events API error:', eRes.status, await eRes.text()); }
        } catch (err) { console.error('Analytics fetch failed:', err); }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Real-time polling every 30s
    useEffect(() => {
        const iv = setInterval(async () => {
            try {
                const r = await fetch('/api/admin/analytics?period=7d');
                if (r.ok) { const d = await r.json(); setRealTime(d.summary.realTimeVisitors); }
            } catch { /* silent */ }
        }, 30_000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="space-y-6 pb-10">
            {/* Header Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Real-time traffic & engagement insights</p>
                    </div>
                    {/* Real-time badge */}
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        {realTime} online now
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period pills */}
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10">
                        {(['7d', '30d', '90d'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    period === p
                                        ? 'bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}>
                                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-gray-200 dark:border-white/10">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            tab === t.id
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
                        }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Loading skeleton */}
            {loading && !data && <LoadingSkeleton />}

            {/* Overview Tab */}
            {tab === 'overview' && data && (
                <>
                    <AnalyticsSummary summary={data.summary} realTime={realTime} />
                    <PageviewTrend data={data.trend} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <TopPagesPanel pages={data.topPages} />
                        <ReferrerPanel referrers={data.topReferrers} />
                    </div>
                </>
            )}

            {/* Audience Tab */}
            {tab === 'audience' && data && (
                <>
                    <AnalyticsSummary summary={data.summary} realTime={realTime} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <GeoPanel countries={data.topCountries} />
                        <TechPanel devices={data.devices} browsers={data.browsers} />
                    </div>
                    <RecentVisitorsPanel />
                </>
            )}

            {/* Events Tab */}
            {tab === 'events' && (
                <>
                    <FunnelPanel funnel={eventsData?.funnel} />
                    <EventsPanel events={eventsData?.events} recentEvents={eventsData?.recentEvents} />
                </>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6 animate-pulse">
                        <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2 mb-4" />
                        <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-2/3" />
                    </div>
                ))}
            </div>
        </div>
    );
}
