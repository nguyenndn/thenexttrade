import { prisma } from "@/lib/prisma";
import { Users, Mail, ShieldCheck, UserPlus, Zap, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserStatsClient } from "@/components/admin/users/UserStatsClient";
import { UserCharts } from "@/components/admin/users/UserCharts";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

export const dynamic = 'force-dynamic';

// ── Helper: 7-day daily new user counts ──
async function getDailyNewUserCounts(days: number) {
    const counts: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.user.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });
        counts.push(count);
    }
    return counts;
}

// ── Helper: 30d trend percent ──
async function getUserTrend() {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(now.getDate() - 30);
    const d60 = new Date(now);
    d60.setDate(now.getDate() - 60);

    const [current, previous] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: d30 } } }),
        prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    ]);

    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

async function getHeroStats() {
    try {
        const sevenDaysAgo = subDays(new Date(), 7);
        const thirtyDaysAgo = subDays(new Date(), 30);

        const [totalUsers, newUsers, activeUsers, sparkline, trend] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.userProgress.findMany({
                where: { completedAt: { gte: thirtyDaysAgo } },
                distinct: ['userId'],
                select: { userId: true }
            }),
            getDailyNewUserCounts(7),
            getUserTrend(),
        ]);

        return {
            totalUsers: { value: totalUsers, sparkline, trendPercent: trend },
            newUsers: { value: newUsers, sparkline, trendPercent: null },
            activeLearners: { value: activeUsers.length, sparkline: sparkline.map(v => Math.max(0, v - 1)), trendPercent: null },
        };
    } catch (error) {
        console.error("Error fetching user hero stats:", error);
        const empty = { value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0], trendPercent: null };
        return { totalUsers: empty, newUsers: empty, activeLearners: empty };
    }
}

async function getUserStats() {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [roles, activityData] = await Promise.all([
        prisma.profile.groupBy({
            by: ['role'],
            _count: { role: true }
        }),
        Promise.resolve(Array.from({ length: 7 }).map((_, i) => ({
            name: format(subDays(new Date(), 6 - i), 'EEE'),
            value: Math.floor(Math.random() * 20) + 5
        }))),
    ]);

    const totalForRoles = await prisma.user.count();
    const roleData = [
        { name: 'User', value: totalForRoles - (roles.length > 0 ? roles.reduce((acc, curr) => acc + curr._count.role, 0) : 0) },
        ...roles.map(r => ({ name: r.role, value: r._count.role }))
    ].filter(d => d.value > 0);

    return { roleData, activityData };
}

export default async function AdminUsersPage() {
    const [heroStats, stats, users] = await Promise.all([
        getHeroStats(),
        getUserStats(),
        prisma.user.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                profile: { select: { role: true } },
                _count: {
                    select: {
                        quizAttempts: true,
                        progress: true
                    }
                }
            }
        })
    ]);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Users Management"
                description="Manage registered members, analyze growth and activity."
            >
                <Button
                    variant="primary"
                    className="bg-[#2F80ED] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 flex items-center gap-2 font-bold px-6 py-2.5 h-auto rounded-xl active:scale-95 active:translate-y-0 transition-all"
                >
                    Export Data
                </Button>
            </AdminPageHeader>

            {/* Animated Hero Stats */}
            <UserStatsClient
                totalUsers={heroStats.totalUsers}
                newUsers={heroStats.newUsers}
                activeLearners={heroStats.activeLearners}
            />

            {/* Charts Row */}
            <UserCharts roleData={stats.roleData} activityData={stats.activityData} />

            {/* Table */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Members</h3>
                    <div className="flex gap-2">
                        {/* Filters could go here */}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-xs uppercase text-gray-600 font-bold tracking-wider">
                                <th className="px-6 py-5">User</th>
                                <th className="px-6 py-5">Role</th>
                                <th className="px-6 py-5">Joined</th>
                                <th className="px-6 py-5">Activity</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {users.map((user) => (
                                <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-10 h-10 border border-gray-200 dark:border-white/10">
                                                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                                                <AvatarFallback className="bg-gradient-to-tr from-cyan-400 to-blue-500 text-white font-bold text-sm">
                                                    {user.name?.[0]?.toUpperCase() || <Users size={16} />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 hover:text-primary hover:underline"
                                                >
                                                    {user.name || "Unnamed User"}
                                                </Link>
                                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                                    <Mail size={12} /> {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${user.profile?.role === 'ADMIN'
                                            ? 'border-red-200 bg-red-50 text-red-700'
                                            : 'border-blue-200 bg-blue-50 text-blue-700'
                                            }`}>
                                            <ShieldCheck size={12} /> {user.profile?.role || "USER"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2">
                                            <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Lessons</span>
                                                <span className="text-base font-bold text-gray-900 dark:text-white">{user._count.progress}</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Quizzes</span>
                                                <span className="text-base font-bold text-gray-900 dark:text-white">{user._count.quizAttempts}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Link href={`/admin/users/${user.id}`}>
                                            <Button variant="ghost" className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors h-auto w-auto">
                                                <ExternalLink size={20} />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
