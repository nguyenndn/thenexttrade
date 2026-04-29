'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Ban, Unlock, Search, X, ChevronLeft, ChevronRight, Zap, Bot, KeyRound, ShieldCheck, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Types
interface SecuritySummary {
    totalEvents: number; blockedIPs: number; rateLimitHits: number;
    botBlocked: number; loginFailed: number; turnstileFailed: number;
    authFailed: number; cronFailed: number;
}
interface SecurityEvent { id: string; type: string; ip: string; userAgent?: string; path?: string; detail?: string; createdAt: string; }
interface TrendItem { date: string; count: number; }
interface TopIP { ip: string; count: number; }
interface BlockedIPRecord { id: string; ip: string; reason?: string; expiresAt?: string; createdAt: string; }
interface Pagination { page: number; pageSize: number; total: number; totalPages: number; }

const EVENT_TYPES = [
    { value: '', label: 'All Types', icon: null },
    { value: 'RATE_LIMIT', label: 'Rate Limit', icon: Zap },
    { value: 'BOT_BLOCKED', label: 'Bot Blocked', icon: Bot },
    { value: 'LOGIN_FAILED', label: 'Login Failed', icon: KeyRound },
    { value: 'TURNSTILE_FAILED', label: 'Turnstile Failed', icon: ShieldCheck },
    { value: 'AUTH_FAILED', label: 'Auth Failed', icon: ShieldAlert },
    { value: 'CRON_FAILED', label: 'Cron Failed', icon: Clock },
    { value: 'IP_BLOCKED', label: 'IP Blocked', icon: Ban },
    { value: 'IP_UNBLOCKED', label: 'IP Unblocked', icon: Unlock },
];

const TYPE_COLORS: Record<string, string> = {
    RATE_LIMIT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    BOT_BLOCKED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    LOGIN_FAILED: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    TURNSTILE_FAILED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    AUTH_FAILED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    CRON_FAILED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    IP_BLOCKED: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
    IP_UNBLOCKED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const PERIODS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
] as const;

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function SecurityDashboard() {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
    const [tab, setTab] = useState<'events' | 'blocked'>('events');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [ipSearch, setIpSearch] = useState('');

    const [summary, setSummary] = useState<SecuritySummary | null>(null);
    const [trend, setTrend] = useState<TrendItem[]>([]);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [topIPs, setTopIPs] = useState<TopIP[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIPRecord[]>([]);

    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockForm, setBlockForm] = useState({ ip: '', reason: '', duration: '' });
    const [blocking, setBlocking] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ period, page: String(page) });
            if (typeFilter) params.set('type', typeFilter);
            if (ipSearch) params.set('ip', ipSearch);
            const [secRes, blockedRes] = await Promise.all([
                fetch(`/api/admin/security?${params}`),
                fetch('/api/admin/security/blocked-ips'),
            ]);
            if (secRes.ok) {
                const d = await secRes.json();
                setSummary(d.summary); setTrend(d.trend); setEvents(d.recentEvents); setTopIPs(d.topIPs); setPagination(d.pagination);
            }
            if (blockedRes.ok) { const d = await blockedRes.json(); setBlockedIPs(d.blockedIPs || []); }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [period, page, typeFilter, ipSearch]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [typeFilter, ipSearch, period]);

    async function handleBlockIP() {
        if (!blockForm.ip) return;
        setBlocking(true);
        try {
            const res = await fetch('/api/admin/security/blocked-ips', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: blockForm.ip, reason: blockForm.reason || undefined, durationMinutes: blockForm.duration ? parseInt(blockForm.duration) : undefined }),
            });
            if (res.ok) { setShowBlockModal(false); setBlockForm({ ip: '', reason: '', duration: '' }); fetchData(); }
        } catch { /* silent */ }
        finally { setBlocking(false); }
    }

    async function handleUnblock(id: string) {
        try { const res = await fetch(`/api/admin/security/blocked-ips/${id}`, { method: 'DELETE' }); if (res.ok) fetchData(); } catch { /* silent */ }
    }

    const maxTrend = Math.max(...trend.map(t => t.count), 1);
    const currentFilterLabel = EVENT_TYPES.find(t => t.value === typeFilter)?.label || 'All Types';

    return (
        <div className="space-y-4 pb-10">
            {/* Admin Page Header — matching AdminPageHeader */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-primary via-emerald-400 to-teal-500 shrink-0" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-700 dark:text-white tracking-tight">Security</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Monitor threats, blocked IPs & security events.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10">
                        {PERIODS.map(p => (
                            <button key={p.value} onClick={() => setPeriod(p.value as typeof period)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    period === p.value ? 'bg-white dark:bg-primary/20 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}>{p.label}</button>
                        ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} aria-label="Refresh data" className="rounded-xl">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: summary.totalEvents, icon: Globe, color: 'text-indigo-500' },
                        { label: 'Rate Limits', value: summary.rateLimitHits, icon: Zap, color: 'text-amber-500' },
                        { label: 'Bots Blocked', value: summary.botBlocked, icon: Bot, color: 'text-red-500' },
                        { label: 'Login Failed', value: summary.loginFailed, icon: KeyRound, color: 'text-orange-500' },
                    ].map(card => (
                        <div key={card.label} className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                                <card.icon size={18} className={card.color} />
                            </div>
                            <p className="text-2xl font-bold text-gray-700 dark:text-white">{card.value.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Mini Trend Chart */}
            {trend.length > 0 && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Events Over Time</p>
                    <div className="flex items-end gap-1 h-20">
                        {trend.map((t, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="absolute -top-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {t.date}: {t.count}
                                </div>
                                <div className="w-full rounded-lg bg-gradient-to-t from-primary/80 to-emerald-400/80 transition-all hover:from-primary hover:to-emerald-400"
                                    style={{ height: `${Math.max((t.count / maxTrend) * 100, 4)}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs — underline style */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
                {[
                    { id: 'events' as const, label: 'All Events' },
                    { id: 'blocked' as const, label: `Blocked IPs (${blockedIPs.length})` },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${
                            tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
                        }`}>{t.label}</button>
                ))}
            </div>

            {/* Events Tab */}
            {tab === 'events' && (
                <div className="space-y-4">
                    {/* Toolbar Card */}
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md">
                            <Search size={16} className="text-gray-500" />
                            <input type="text" placeholder="Search IP..." value={ipSearch} onChange={e => setIpSearch(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none w-full text-gray-700 dark:text-white placeholder:text-gray-500" />
                            {ipSearch && <button onClick={() => setIpSearch('')} className="text-gray-400 hover:text-gray-600" aria-label="Clear search"><X size={14} /></button>}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 text-xs font-bold rounded-xl">
                                    Type: <span className="text-primary">{currentFilterLabel}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {EVENT_TYPES.map(t => (
                                    <DropdownMenuItem key={t.value} onClick={() => setTypeFilter(t.value)}
                                        className={cn(typeFilter === t.value && 'text-primary font-bold')}>
                                        {t.icon && <t.icon size={14} className="mr-2" />}
                                        {t.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="primary" onClick={() => { setShowBlockModal(true); setBlockForm({ ip: '', reason: '', duration: '' }); }}
                            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20">
                            <Ban size={14} /> Block IP
                        </Button>
                    </div>

                    {/* Data Table Card */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Type</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">IP</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 hidden md:table-cell">Path</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 hidden lg:table-cell">Detail</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {events.length === 0 ? (
                                        <tr><td colSpan={5} className="py-12 text-center text-gray-400">No security events found</td></tr>
                                    ) : events.map(ev => (
                                        <tr key={ev.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${TYPE_COLORS[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                                                    {ev.type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{ev.ip}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">{ev.path || '-'}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[300px] truncate text-xs">{ev.detail || '-'}</td>
                                            <td className="px-6 py-4 text-right text-gray-400 text-xs whitespace-nowrap">{timeAgo(ev.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                <p className="text-xs font-bold text-gray-500">{pagination.total} events total</p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="rounded-xl">
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <span className="text-xs font-bold text-gray-500 px-3">{page} / {pagination.totalPages}</span>
                                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} aria-label="Next page" className="rounded-xl">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Blocked IPs Tab */}
            {tab === 'blocked' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-700 dark:text-white">Blocked IPs ({blockedIPs.length})</p>
                        <Button variant="primary" onClick={() => { setShowBlockModal(true); setBlockForm({ ip: '', reason: '', duration: '' }); }}
                            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20">
                            <Ban size={14} /> Block IP
                        </Button>
                    </div>
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">IP Address</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Reason</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 hidden md:table-cell">Expires</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 hidden md:table-cell">Blocked At</th>
                                        <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {blockedIPs.length === 0 ? (
                                        <tr><td colSpan={5} className="py-12 text-center text-gray-400">No blocked IPs</td></tr>
                                    ) : blockedIPs.map(ip => (
                                        <tr key={ip.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-red-600 dark:text-red-400">{ip.ip}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ip.reason || '-'}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell">{ip.expiresAt ? new Date(ip.expiresAt).toLocaleString() : 'Permanent'}</td>
                                            <td className="px-6 py-4 text-gray-400 text-xs hidden md:table-cell">{timeAgo(ip.createdAt)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleUnblock(ip.id)}
                                                    className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl">
                                                    <Unlock size={14} /> Unblock
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Threat IPs */}
            {topIPs.length > 0 && tab === 'events' && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Top Threat IPs</p>
                    <div className="space-y-3">
                        {topIPs.slice(0, 5).map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 w-36 truncate">{t.ip}</span>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" style={{ width: `${(t.count / topIPs[0].count) * 100}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-500 w-10 text-right">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Block IP Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowBlockModal(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1E2028] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <Ban size={18} className="text-red-500" />
                                <h3 className="text-base font-bold text-gray-700 dark:text-white">Block IP Address</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">IP Address <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="e.g. 192.168.1.1" value={blockForm.ip} onChange={e => setBlockForm(f => ({ ...f, ip: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500" />
                                </div>
                                <div className="group">
                                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Reason <span className="font-normal text-gray-500">(Optional)</span></label>
                                    <input type="text" placeholder="e.g. Brute force attempt" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500" />
                                </div>
                                <div className="group">
                                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Duration (minutes) <span className="font-normal text-gray-500">(Empty = permanent)</span></label>
                                    <input type="number" placeholder="e.g. 1440 (24h)" value={blockForm.duration} onChange={e => setBlockForm(f => ({ ...f, duration: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowBlockModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleBlockIP} disabled={!blockForm.ip || blocking} isLoading={blocking}
                                    className="bg-red-600 hover:bg-red-700">
                                    Block IP
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
