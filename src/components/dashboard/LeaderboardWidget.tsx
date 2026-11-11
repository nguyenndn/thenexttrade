import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";

export async function LeaderboardWidget() {
    const user = await getAuthUser();

    // Show opted-in users sorted by XP/streak while excluding manual-only trade accounts
    const topUsers = await prisma.user.findMany({
        where: {
            showOnLeaderboard: true,
            OR: [
                { xp: { gt: 0 } },
                { streak: { gt: 0 } },
                {
                    journalEntries: {
                        some: {
                            status: "CLOSED",
                            syncSource: { not: "MANUAL" },
                        },
                    },
                },
            ],
            NOT: {
                AND: [
                    { xp: 0 },
                    { streak: 0 },
                    {
                        journalEntries: {
                            every: { syncSource: "MANUAL" },
                        },
                    },
                ],
            },
        },
        orderBy: [{ xp: "desc" }, { streak: "desc" }],
        take: 5,
        select: {
            id: true,
            name: true,
            image: true,
            xp: true,
            streak: true,
            profile: {
                select: {
                    username: true,
                    showRealName: true,
                },
            },
            _count: {
                select: {
                    journalEntries: {
                        where: {
                            status: "CLOSED",
                            syncSource: { not: "MANUAL" },
                        },
                    },
                },
            },
        },
    });

    // Always show the widget, even with empty state
    const myXp = user
        ? ((
              await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { xp: true },
              })
          )?.xp ?? 0)
        : 0;

    const myRank = user
        ? (await prisma.user.count({
              where: { showOnLeaderboard: true, xp: { gt: myXp } },
          })) + 1
        : null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    Top Traders
                </h3>
                <Link
                    href="/dashboard/leaderboard"
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                    View All <ArrowRight size={12} />
                </Link>
            </div>

            {topUsers.length === 0 ? (
                <div className="text-center py-4">
                    <Trophy
                        size={24}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                        Start earning Edge to appear on the leaderboard!
                    </p>
                    <Link
                        href="/dashboard/leaderboard"
                        className="mt-2 inline-block text-xs font-bold text-primary hover:text-primary/80"
                    >
                        Go to Leaderboard
                    </Link>
                </div>
            ) : (
                <>
                    {/* List */}
                    <div className="space-y-1.5">
                        {topUsers.map((u, i) => {
                            const isMe = user?.id === u.id;
                            const showRealName =
                                u.profile?.showRealName ?? false;
                            const displayName = isMe
                                ? u.name ||
                                  (u.profile?.username
                                      ? `@${u.profile.username}`
                                      : "Trader")
                                : showRealName && u.name
                                  ? u.name
                                  : u.profile?.username
                                    ? `@${u.profile.username}`
                                    : "Trader";
                            const displayAvatar =
                                isMe || showRealName ? u.image : null;
                            const avatarInitial =
                                displayName
                                    .replace(/^@/, "")
                                    .charAt(0)
                                    .toUpperCase() || "T";
                            const score =
                                u.xp > 0
                                    ? u.xp
                                    : u.streak > 0
                                      ? u.streak
                                      : u._count.journalEntries;
                            const scoreLabel =
                                u.xp > 0
                                    ? "Edge"
                                    : u.streak > 0
                                      ? "d"
                                      : " trades";

                            return (
                                <div
                                    key={u.id}
                                    className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg transition-colors ${
                                        isMe
                                            ? "bg-primary/5 border border-primary/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                                    }`}
                                >
                                    {/* Rank */}
                                    <span
                                        className={`text-xs font-black w-5 text-center ${
                                            i === 0
                                                ? "text-yellow-500"
                                                : i === 1
                                                  ? "text-gray-500"
                                                  : i === 2
                                                    ? "text-orange-400"
                                                    : "text-gray-500"
                                        }`}
                                    >
                                        {i + 1}
                                    </span>

                                    {/* Avatar */}
                                    <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                                        {displayAvatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={displayAvatar}
                                                alt={displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            avatarInitial
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span
                                        className={`text-xs font-bold flex-1 truncate ${
                                            isMe
                                                ? "text-primary"
                                                : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        {displayName}
                                        {isMe && (
                                            <span className="text-gray-500 font-normal ml-1">
                                                (You)
                                            </span>
                                        )}
                                    </span>

                                    {/* Score */}
                                    <span className="text-[10px] font-bold text-gray-500 tabular-nums">
                                        {score.toLocaleString()}
                                        {scoreLabel !== "Edge"
                                            ? scoreLabel
                                            : ""}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* My rank footer */}
                    {user &&
                        myRank &&
                        !topUsers.some((u) => u.id === user.id) && (
                            <div className="mt-3 pt-3 border-t border-dashboard flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Your rank
                                </span>
                                <span className="text-xs font-black text-primary">
                                    #{myRank}
                                </span>
                            </div>
                        )}
                </>
            )}
        </div>
    );
}
