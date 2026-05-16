'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, BarChart3, FileText, Users, MousePointerClick } from 'lucide-react';
import { AnalyticsSummary } from '@/components/admin/analytics/AnalyticsSummary';
import { PageviewTrend } from '@/components/admin/analytics/PageviewTrend';
import { GeoPanel } from '@/components/admin/analytics/GeoPanel';
import { TopPagesPanel } from '@/components/admin/analytics/TopPagesPanel';
import { TechPanel } from '@/components/admin/analytics/TechPanel';
import { ReferrerPanel } from '@/components/admin/analytics/ReferrerPanel';
import { FunnelPanel } from '@/components/admin/analytics/FunnelPanel';
import { EventsPanel } from '@/components/admin/analytics/EventsPanel';
import { RecentVisitorsPanel } from '@/components/admin/analytics/RecentVisitorsPanel';
import { ContentAnalyticsPanel } from '@/components/admin/analytics/ContentAnalyticsPanel';
import { CampaignPanel } from '@/components/admin/analytics/CampaignPanel';
import { Button } from '@/components/ui/Button';
import { exportCSV } from '@/lib/export-csv';
import type { AnalyticsData, EventsData } from '@/components/admin/analytics/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'events', label: 'Events', icon: MousePointerClick },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PERIODS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
] as const;

interface ContentData {
    content: Array<{
        pathname: string;
        slug: string;
        title: string;
        author: string;
        category: string;
        views: number;
        publishedAt: string | null;
    }>;
    authors: Array<{ name: string; views: number }>;
    categories: Array<{ name: string; views: number }>;
    totalArticleViews: number;
}

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
    const [tab, setTab] = useState<TabId>('overview');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [eventsData, setEventsData] = useState<EventsData | null>(null);
    const [contentData, setContentData] = useState<ContentData | null>(null);
    const [campaignData, setCampaignData] = useState<{ campaigns: Array<{ campaign: string; source: string; medium: string; views: number; uniqueVisitors: number }>; totalCampaignViews: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [realTime, setRealTime] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [aRes, eRes, cRes] = await Promise.all([
                fetch(`/api/admin/analytics?period=${period}`),
                fetch(`/api/admin/analytics/events?period=${period}`),
                fetch(`/api/admin/analytics/campaigns?period=${period}`),
            ]);
            if (aRes.ok) { const d = await aRes.json(); setData(d); setRealTime(d.summary.realTimeVisitors); }
            if (eRes.ok) { setEventsData(await eRes.json()); }
            if (cRes.ok) { setCampaignData(await cRes.json()); }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [period]);

    const fetchContentData = useCallback(async () => {
        setContentLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics/content?period=${period}`);
            if (res.ok) { setContentData(await res.json()); }
        } catch { /* silent */ }
        finally { setContentLoading(false); }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch content data when tab switches to content
    useEffect(() => {
        if (tab === 'content' && !contentData) {
            fetchContentData();
        }
    }, [tab, contentData, fetchContentData]);

    // Refetch content when period changes
    useEffect(() => {
        if (tab === 'content') {
            fetchContentData();
        }
    }, [period]);

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

    // Export handlers
    const handleExportPageviews = () => {
        if (!data?.trend) return;
        exportCSV(data.trend.map(d => ({ date: d.date, views: d.views })), `pageviews_${period}`);
    };

    const handleExportTopPages = () => {
        if (!data?.topPages) return;
        exportCSV(data.topPages, `top_pages_${period}`);
    };

    return (
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} tabsId="admin-analytics">
        <div className="space-y-4 pb-10">
            {/* Admin Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-primary via-emerald-400 to-teal-500 shrink-0" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-700 dark:text-white tracking-tight">
                                Analytics
                            </h1>
                            {/* Real-time badge */}
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                {realTime} online
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            Real-time traffic &amp; engagement insights.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period pills */}
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10">
                        {PERIODS.map(p => (
                            <button key={p.value} onClick={() => setPeriod(p.value as typeof period)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    period === p.value
                                        ? 'bg-white dark:bg-primary/20 text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchData}
                        disabled={loading}
                        aria-label="Refresh data"
                        className="rounded-xl"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="overflow-x-auto scrollbar-hide flex">
                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
                    {TABS.map(t => (
                        <TabsTrigger
                            key={t.id}
                            value={t.id}
                            className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                            activeTextClassName="!text-white"
                        >
                            <t.icon size={15} />
                            <span>{t.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            {/* Loading skeleton */}
            {loading && !data && <LoadingSkeleton />}

            {/* Overview Tab */}
            {tab === 'overview' && data && (
                <>
                    <AnalyticsSummary summary={data.summary} realTime={realTime} />
                    <div className="relative">
                        <PageviewTrend data={data.trend} />
                        <button
                            onClick={handleExportPageviews}
                            className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="Export CSV"
                            aria-label="Export pageviews as CSV"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="relative">
                            <TopPagesPanel pages={data.topPages} />
                            <button
                                onClick={handleExportTopPages}
                                className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                title="Export CSV"
                                aria-label="Export top pages as CSV"
                            >
                                <Download size={14} />
                            </button>
                        </div>
                        <ReferrerPanel referrers={data.topReferrers} />
                    </div>
                    <CampaignPanel
                        campaigns={campaignData?.campaigns || []}
                        totalViews={campaignData?.totalCampaignViews || 0}
                    />
                </>
            )}

            {/* Content Tab */}
            {tab === 'content' && (
                <>
                    {data && <AnalyticsSummary summary={data.summary} realTime={realTime} />}
                    <h2 className="text-sm font-bold text-gray-700 dark:text-white">Content Performance</h2>
                    <ContentAnalyticsPanel
                        content={contentData?.content || []}
                        authors={contentData?.authors || []}
                        categories={contentData?.categories || []}
                        totalArticleViews={contentData?.totalArticleViews || 0}
                        loading={contentLoading}
                    />
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
        </Tabs>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-gray-200 dark:bg-white/5" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/2 mb-2" />
                                <div className="h-2 bg-gray-200 dark:bg-white/5 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
