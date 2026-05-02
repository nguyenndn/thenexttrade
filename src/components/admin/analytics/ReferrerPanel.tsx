'use client';

import { useMemo } from 'react';
import { Share2, Search, Globe, Users, Link2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
    referrers: Array<{ referrer: string; views: number }>;
}

// Source classification patterns
const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'ecosia', 'brave'];
const SOCIAL_MEDIA = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'reddit', 'youtube', 'pinterest', 't.co', 'threads'];

function classifySource(referrer: string | null): 'direct' | 'organic' | 'social' | 'referral' {
    if (!referrer) return 'direct';
    const lower = referrer.toLowerCase();
    if (SEARCH_ENGINES.some(se => lower.includes(se))) return 'organic';
    if (SOCIAL_MEDIA.some(sm => lower.includes(sm))) return 'social';
    return 'referral';
}

const CATEGORY_CONFIG = {
    direct: { label: 'Direct', icon: Globe, color: '#6366f1', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', textColor: 'text-indigo-500' },
    organic: { label: 'Organic Search', icon: Search, color: '#22c55e', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', textColor: 'text-emerald-500' },
    social: { label: 'Social Media', icon: Users, color: '#06b6d4', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', textColor: 'text-cyan-500' },
    referral: { label: 'Referral', icon: Link2, color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-500/10', textColor: 'text-amber-500' },
} as const;

export function ReferrerPanel({ referrers }: Props) {
    const { categories, topReferrers, total } = useMemo(() => {
        const cats: Record<string, number> = { direct: 0, organic: 0, social: 0, referral: 0 };

        referrers.forEach(r => {
            const cat = classifySource(r.referrer);
            cats[cat] += r.views;
        });

        const totalViews = Object.values(cats).reduce((a, b) => a + b, 0);

        return {
            categories: Object.entries(cats)
                .map(([key, views]) => ({ key: key as keyof typeof CATEGORY_CONFIG, views }))
                .filter(c => c.views > 0)
                .sort((a, b) => b.views - a.views),
            topReferrers: referrers.filter(r => r.referrer).slice(0, 8),
            total: totalViews,
        };
    }, [referrers]);

    const pieData = categories.map(c => ({
        name: CATEGORY_CONFIG[c.key].label,
        value: c.views,
        color: CATEGORY_CONFIG[c.key].color,
    }));

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Traffic Sources</h2>
            </div>

            {/* Pie Chart + Categories side by side */}
            <div className="flex items-center gap-4 mb-5">
                {/* Mini Pie */}
                <div className="w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width={100} height={100}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={45}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 11, padding: '4px 8px' }}
                                formatter={(value) => [`${Number(value).toLocaleString()}`, 'Views']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category breakdown */}
                <div className="flex-1 space-y-2">
                    {categories.map(c => {
                        const config = CATEGORY_CONFIG[c.key];
                        const Icon = config.icon;
                        const pct = total > 0 ? Math.round((c.views / total) * 100) : 0;
                        return (
                            <div key={c.key} className="flex items-center gap-2">
                                <div className={`p-1 rounded ${config.bgColor}`}>
                                    <Icon size={12} className={config.textColor} />
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{config.label}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{c.views.toLocaleString()}</span>
                                <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Referrers table */}
            {topReferrers.length > 0 && (
                <>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-white/5 mb-1">
                        Top Referrers
                    </div>
                    <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                        {topReferrers.map(r => {
                            const pct = total > 0 ? Math.round((r.views / total) * 100) : 0;
                            return (
                                <div key={r.referrer} className="relative group">
                                    <div className="absolute inset-0 bg-gray-50 dark:bg-white/3 rounded-md"
                                        style={{ width: `${pct}%` }} />
                                    <div className="relative flex items-center justify-between py-2 px-3">
                                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[70%]">
                                            {r.referrer}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {r.views.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {!referrers.length && (
                <div className="text-center py-8">
                    <Share2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No referrer data yet</p>
                </div>
            )}
        </div>
    );
}
