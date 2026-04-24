'use client';

import { Zap, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EVENT_LABELS, COUNTRY_FLAGS } from './types';

interface Props {
    events?: Array<{ name: string; count: number }>;
    recentEvents?: Array<{
        id: string;
        name: string;
        data: Record<string, string> | null;
        pathname: string | null;
        country: string | null;
        createdAt: string;
    }>;
}

export function EventsPanel({ events, recentEvents }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Event Breakdown */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Custom Events</h2>
                </div>

                {events?.length ? (
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={events.map(e => ({
                                name: EVENT_LABELS[e.name] || e.name,
                                count: e.count,
                            }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.08)" />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={100} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Zap className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">No custom events tracked yet.</p>
                    </div>
                )}
            </div>

            {/* Live Event Feed */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Live Feed</h2>
                </div>

                <div className="space-y-1 max-h-[320px] overflow-y-auto">
                    {recentEvents?.map(e => (
                        <div key={e.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                            <span className="text-base shrink-0">{COUNTRY_FLAGS[e.country ?? ''] || '🌍'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {EVENT_LABELS[e.name] || e.name}
                                </p>
                                {e.pathname && (
                                    <p className="text-[11px] text-gray-400 truncate font-mono">{e.pathname}</p>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                                {new Date(e.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {(!recentEvents?.length) && (
                        <div className="text-center py-12">
                            <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Events will appear here in real-time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
