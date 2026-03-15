import { prisma } from "@/lib/prisma";
import { Users, Mail, ShieldCheck, MoreHorizontal, UserCheck, UserPlus, Zap, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserCharts } from "@/components/admin/users/UserCharts";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

export const dynamic = 'force-dynamic';

async function getUserStats() {
    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [totalUsers, newUsers, activeUsers, roles, activityData, topUsers] = await Promise.all([
        // 1. Total
        prisma.user.count(),
        // 2. New Users 7d
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        // 3. Active Users 30d (Distinct)
        prisma.userProgress.findMany({
            where: { completedAt: { gte: thirtyDaysAgo } },
            distinct: ['userId'],
            select: { userId: true }
        }),
        // 4. Roles
        prisma.profile.groupBy({
            by: ['role'],
            _count: { role: true }
        }),
        // 5. Activity (Mocked for now as per original code pattern, or optimized?)
        // Keeping original mock generation logic but essentially it was just array mapping.
        // We can just return the mock data directly here without async if it's pure mock.
        Promise.resolve(Array.from({ length: 7 }).map((_, i) => ({
            name: format(subDays(new Date(), 6 - i), 'EEE'),
            value: Math.floor(Math.random() * 20) + 5
        }))),
        // 6. Top Users (Optimized: N+1 Fix)
        (async () => {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    _count: {
                        select: {
                            progress: {
                                where: { isCompleted: true }
                            }
                        }
                    }
                }
            });

            // Sort in memory (faster than DB orderBy with count)
            return users
                .sort((a, b) => b._count.progress - a._count.progress)
                .slice(0, 5);
        })()
    ]);

    // Format Role Data
    const roleData = [
        { name: 'User', value: totalUsers - (roles.length > 0 ? roles.reduce((acc, curr) => acc + curr._count.role, 0) : 0) },
        ...roles.map(r => ({ name: r.role, value: r._count.role }))
    ].filter(d => d.value > 0);

    return { totalUsers, newUsers, activeUsersCount: activeUsers.length, roleData, activityData, topUsers }; // Added topUsers to return
}

export default async function AdminUsersPage() {
    // Parallel Fetching
    const [stats, users] = await Promise.all([
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.totalUsers.toLocaleString()}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">New (Last 7 Days)</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">+{stats.newUsers}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                            <UserPlus size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Learners</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.activeUsersCount}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                            <Zap size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>

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
                            <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-xs uppercase text-gray-500 font-bold tracking-wider">
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
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
