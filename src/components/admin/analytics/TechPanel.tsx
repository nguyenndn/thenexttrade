'use client';

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PIE_COLORS } from './types';

interface Props {
    devices: Array<{ device: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
}

const DEVICE_CONFIG: Record<string, { icon: typeof Monitor; color: string }> = {
    desktop: { icon: Monitor, color: '#6366f1' },
    mobile: { icon: Smartphone, color: '#22d3ee' },
    tablet: { icon: Tablet, color: '#f59e0b' },
};

export function TechPanel({ devices, browsers }: Props) {
    const totalDevices = devices.reduce((s, d) => s + d.count, 0) || 1;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Technology</h2>

            {/* Devices */}
            <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Devices</p>
                <div className="grid grid-cols-3 gap-3">
                    {devices.map(d => {
                        const cfg = DEVICE_CONFIG[d.device] || DEVICE_CONFIG.desktop;
                        const Icon = cfg.icon;
                        const pct = Math.round((d.count / totalDevices) * 100);
                        return (
                            <div key={d.device} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5">
                                <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: cfg.color }} />
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{pct}%</p>
                                <p className="text-xs text-gray-500 capitalize">{d.device}</p>
                            </div>
                        );
                    })}
                    {!devices.length && <p className="col-span-3 text-sm text-gray-400 text-center py-4">No data</p>}
                </div>
            </div>

            {/* Browsers */}
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Browsers</p>
                {browsers.length > 0 ? (
                    <div className="flex items-center gap-4">
                        <div className="w-[130px] h-[130px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={browsers} dataKey="count" nameKey="browser"
                                        cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2}>
                                        {browsers.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            {browsers.slice(0, 6).map((b, i) => {
                                const total = browsers.reduce((s, x) => s + x.count, 0) || 1;
                                const pct = Math.round((b.count / total) * 100);
                                return (
                                    <div key={b.browser} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{b.browser}</span>
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No data</p>
                )}
            </div>
        </div>
    );
}
