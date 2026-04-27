'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Ban, Unlock, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Types
interface SecuritySummary {
    totalEvents: number;
    blockedIPs: number;
    rateLimitHits: number;
    botBlocked: number;
    loginFailed: number;
    turnstileFailed: number;
    authFailed: number;
    cronFailed: number;
}

interface SecurityEvent {
    id: string;
    type: string;
    ip: string;
    userAgent?: string;
    path?: string;
    detail?: string;
    createdAt: string;
}

interface TrendItem { date: string; count: number; }
interface TopIP { ip: string; count: number; }
interface BlockedIPRecord { id: string; ip: string; reason?: string; expiresAt?: string; createdAt: string; }
interface Pagination { page: number; pageSize: number; total: number; totalPages: number; }

const EVENT_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'RATE_LIMIT', label: '⚡ Rate Limit' },
    { value: 'BOT_BLOCKED', label: '🤖 Bot Blocked' },
    { value: 'LOGIN_FAILED', label: '🔑 Login Failed' },
    { value: 'TURNSTILE_FAILED', label: '🛡️ Turnstile Failed' },
    { value: 'AUTH_FAILED', label: '🔒 Auth Failed' },
    { value: 'CRON_FAILED', label: '⏰ Cron Failed' },
    { value: 'IP_BLOCKED', label: '🚫 IP Blocked' },
    { value: 'IP_UNBLOCKED', label: '✅ IP Unblocked' },
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

    // Block IP modal
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
                setSummary(d.summary);
                setTrend(d.trend);
                setEvents(d.recentEvents);
                setTopIPs(d.topIPs);
                setPagination(d.pagination);
            }
            if (blockedRes.ok) {
                const d = await blockedRes.json();
                setBlockedIPs(d.blockedIPs || []);
            }
        } catch (err) { console.error('Security fetch failed:', err); }
        finally { setLoading(false); }
    }, [period, page, typeFilter, ipSearch]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [typeFilter, ipSearch, period]);

    async function handleBlockIP() {
        if (!blockForm.ip) return;
        setBlocking(true);
        try {
            const res = await fetch('/api/admin/security/blocked-ips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip: blockForm.ip,
                    reason: blockForm.reason || undefined,
                    durationMinutes: blockForm.duration ? parseInt(blockForm.duration) : undefined,
                }),
            });
            if (res.ok) {
                setShowBlockModal(false);
                setBlockForm({ ip: '', reason: '', duration: '' });
                fetchData();
            }
        } catch { /* silent */ }
        finally { setBlocking(false); }
    }

    async function handleUnblock(id: string) {
        try {
            const res = await fetch(`/api/admin/security/blocked-ips/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch { /* silent */ }
    }

    const maxTrend = Math.max(...trend.map(t => t.count), 1);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-600">
                        <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Security</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Monitor threats, blocked IPs & security events</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(['7d', '30d', '90d'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === p ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >{p}</button>
                    ))}
                    <button onClick={fetchData} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Events', value: summary.totalEvents, color: 'from-slate-500 to-slate-700' },
                        { label: 'Rate Limits', value: summary.rateLimitHits, color: 'from-amber-500 to-amber-700' },
                        { label: 'Bots Blocked', value: summary.botBlocked, color: 'from-red-500 to-red-700' },
                        { label: 'Login Failed', value: summary.loginFailed, color: 'from-orange-500 to-orange-700' },
                    ].map(card => (
                        <div key={card.label} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/10 p-4">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                            <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${card.color} mt-2 opacity-60`} />
                        </div>
                    ))}
                </div>
            )}

            {/* Mini Trend Chart (CSS bars) */}
            {trend.length > 0 && (
                <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Events Over Time</p>
                    <div className="flex items-end gap-1 h-20">
                        {trend.map((t, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="absolute -top-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {t.date}: {t.count}
                                </div>
                                <div className="w-full rounded-sm bg-gradient-to-t from-red-500/80 to-orange-400/80 transition-all hover:from-red-500 hover:to-orange-400"
                                    style={{ height: `${Math.max((t.count / maxTrend) * 100, 4)}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                {[
                    { id: 'events' as const, label: 'All Events' },
                    { id: 'blocked' as const, label: `Blocked IPs (${blockedIPs.length})` },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === t.id ? 'bg-white dark:bg-[#1A1D27] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
                    >{t.label}</button>
                ))}
            </div>

            {/* Events Tab */}
            {tab === 'events' && (
                <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {/* Filters */}
                    <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-white/5 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search IP..." value={ipSearch} onChange={e => setIpSearch(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary/50" />
                            {ipSearch && <button onClick={() => setIpSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                            className="px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none">
                            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => { setShowBlockModal(true); setBlockForm({ ip: '', reason: '', duration: '' }); }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                            <Ban size={14} /> Block IP
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="text-left py-2.5 px-3 font-medium">Type</th>
                                    <th className="text-left py-2.5 px-3 font-medium">IP</th>
                                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Path</th>
                                    <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">Detail</th>
                                    <th className="text-right py-2.5 px-3 font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {events.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-gray-400">No security events found</td></tr>
                                ) : events.map(ev => (
                                    <tr key={ev.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${TYPE_COLORS[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                                                {ev.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-xs text-gray-700 dark:text-gray-300">{ev.ip}</td>
                                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">{ev.path || '-'}</td>
                                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[300px] truncate text-xs">{ev.detail || '-'}</td>
                                        <td className="py-2.5 px-3 text-right text-gray-400 text-xs whitespace-nowrap">{timeAgo(ev.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500">{pagination.total} events total</p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={16} /></button>
                                <span className="text-xs text-gray-500 px-2">{page} / {pagination.totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Blocked IPs Tab */}
            {tab === 'blocked' && (
                <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/5">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Blocked IPs ({blockedIPs.length})</p>
                        <button onClick={() => { setShowBlockModal(true); setBlockForm({ ip: '', reason: '', duration: '' }); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                            <Ban size={12} /> Block IP
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="text-left py-2.5 px-3 font-medium">IP Address</th>
                                    <th className="text-left py-2.5 px-3 font-medium">Reason</th>
                                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Expires</th>
                                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Blocked At</th>
                                    <th className="text-right py-2.5 px-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {blockedIPs.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-gray-400">No blocked IPs</td></tr>
                                ) : blockedIPs.map(ip => (
                                    <tr key={ip.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                                        <td className="py-2.5 px-3 font-mono text-xs font-bold text-red-600 dark:text-red-400">{ip.ip}</td>
                                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">{ip.reason || '-'}</td>
                                        <td className="py-2.5 px-3 text-gray-500 text-xs hidden md:table-cell">{ip.expiresAt ? new Date(ip.expiresAt).toLocaleString() : 'Permanent'}</td>
                                        <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell">{timeAgo(ip.createdAt)}</td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button onClick={() => handleUnblock(ip.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors">
                                                <Unlock size={12} /> Unblock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Threat IPs */}
            {topIPs.length > 0 && tab === 'events' && (
                <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Top Threat IPs</p>
                    <div className="space-y-2">
                        {topIPs.slice(0, 5).map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 w-36 truncate">{t.ip}</span>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full" style={{ width: `${(t.count / topIPs[0].count) * 100}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 w-10 text-right">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Block IP Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-2">
                            <Ban size={18} className="text-red-500" />
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">Block IP Address</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">IP Address *</label>
                                <input type="text" placeholder="e.g. 192.168.1.1" value={blockForm.ip} onChange={e => setBlockForm(f => ({ ...f, ip: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Reason</label>
                                <input type="text" placeholder="e.g. Brute force attempt" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Duration (minutes, empty = permanent)</label>
                                <input type="number" placeholder="e.g. 1440 (24h)" value={blockForm.duration} onChange={e => setBlockForm(f => ({ ...f, duration: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary/50" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button onClick={() => setShowBlockModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg border border-gray-200 dark:border-white/10 transition-colors">Cancel</button>
                            <button onClick={handleBlockIP} disabled={!blockForm.ip || blocking}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {blocking ? 'Blocking...' : 'Block IP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
