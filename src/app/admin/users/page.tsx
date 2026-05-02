import { prisma } from "@/lib/prisma";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserStatsClient } from "@/components/admin/users/UserStatsClient";
import { UserCharts } from "@/components/admin/users/UserCharts";
import { UserList } from "@/components/admin/users/UserList";
import { UserPageActions } from "@/components/admin/users/UserPageActions";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

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

        const [totalUsers, newUsers, activeUsers, sparkline, trend] =
            await Promise.all([
                prisma.user.count(),
                prisma.user.count({
                    where: { createdAt: { gte: sevenDaysAgo } },
                }),
                prisma.userProgress.findMany({
                    where: { completedAt: { gte: thirtyDaysAgo } },
                    distinct: ["userId"],
                    select: { userId: true },
                }),
                getDailyNewUserCounts(7),
                getUserTrend(),
            ]);

        return {
            totalUsers: {
                value: totalUsers,
                sparkline,
                trendPercent: trend,
            },
            newUsers: {
                value: newUsers,
                sparkline,
                trendPercent: null,
            },
            activeLearners: {
                value: activeUsers.length,
                sparkline: sparkline.map((v) => Math.max(0, v - 1)),
                trendPercent: null,
            },
        };
    } catch (error) {
        console.error("Error fetching user hero stats:", error);
        const empty = {
            value: 0,
            sparkline: [0, 0, 0, 0, 0, 0, 0],
            trendPercent: null,
        };
        return {
            totalUsers: empty,
            newUsers: empty,
            activeLearners: empty,
        };
    }
}

async function getUserStats() {
    const sevenDaysAgo = subDays(new Date(), 7);

    const [roles, recentActivity] = await Promise.all([
        prisma.profile.groupBy({
            by: ["role"],
            _count: { role: true },
        }),
        prisma.userProgress.findMany({
            where: { completedAt: { gte: sevenDaysAgo, not: null } },
            select: { completedAt: true },
        }),
    ]);

    // Build real 7-day activity chart from lesson completions
    const activityMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
        const day = format(subDays(new Date(), i), "EEE");
        activityMap.set(day, 0);
    }
    recentActivity.forEach((p) => {
        if (p.completedAt) {
            const day = format(new Date(p.completedAt), "EEE");
            if (activityMap.has(day)) {
                activityMap.set(day, (activityMap.get(day) || 0) + 1);
            }
        }
    });
    const activityData = Array.from(activityMap.entries()).map(
        ([name, value]) => ({ name, value })
    );

    const totalForRoles = await prisma.user.count();
    const roleData = [
        {
            name: "User",
            value:
                totalForRoles -
                (roles.length > 0
                    ? roles.reduce((acc, curr) => acc + curr._count.role, 0)
                    : 0),
        },
        ...roles.map((r) => ({ name: r.role, value: r._count.role })),
    ].filter((d) => d.value > 0);

    return { roleData, activityData };
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        role?: string;
    }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const query = params.q || "";
    const role = params.role || "";
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query) {
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
        ];
    }

    if (role) {
        where.profile = { role };
    }

    const [heroStats, stats, users, totalCount] = await Promise.all([
        getHeroStats(),
        getUserStats(),
        prisma.user.findMany({
            where,
            take: limit,
            skip,
            orderBy: { createdAt: "desc" },
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
                        progress: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Users Management"
                description="Manage registered members, analyze growth and activity."
            >
                <UserPageActions />
            </AdminPageHeader>

            {/* Animated Hero Stats */}
            <UserStatsClient
                totalUsers={heroStats.totalUsers}
                newUsers={heroStats.newUsers}
                activeLearners={heroStats.activeLearners}
            />

            {/* Charts Row */}
            <UserCharts
                roleData={stats.roleData}
                activityData={stats.activityData}
            />

            {/* User List with Search, Filter, Pagination */}
            <UserList
                initialUsers={users as any}
                pagination={{ currentPage: page, totalPages }}
            />
        </div>
    );
}
