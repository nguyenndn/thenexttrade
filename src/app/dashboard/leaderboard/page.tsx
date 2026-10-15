import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import {
    getLeaderboard,
    getLeaderboardSidebarData,
    getActiveCompetition,
    getUserCompetitionEnrollment,
    type LeaderboardType,
    type PeriodFilter,
} from "./actions";
import { getTradingAccounts } from "@/actions/accounts";
import { LeaderboardTabs } from "./components/LeaderboardTabs";
import { LeaderboardContent } from "./components/LeaderboardContent";
import { MyStatsView } from "./components/MyStatsView";
import { TradingSetupModal } from "./components/TradingSetupModal";
import { RankUpModal } from "./components/RankUpModal";
import { LeaderboardSidebar } from "./components/LeaderboardSidebar";
import { TradingSprintBanner } from "./components/TradingSprintBanner";

import { getTier } from "@/lib/gamification";
import { PageHeader } from "@/components/ui/PageHeader";

const VALID_TYPES: LeaderboardType[] = [
    "sprint",
    "trading",
    "xp",
    "streak",
    "academy",
    "mystats",
];

export const metadata = {
    title: "Leaderboard & Trading Sprints | TheNextTrade",
    description:
        "Compete on verified MT5 trading sprints, track execution discipline, and climb the live community leaderboard.",
};

interface PageProps {
    searchParams: Promise<{ type?: string; sortBy?: string; period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
    const params = await searchParams;
    let rawType = params.type || "trading";
    if (rawType === "xp") {
        rawType = "trading";
    }

    const rawSortBy = params.sortBy || "currency";
    const sortBy = (rawSortBy === "percentage" ? "percentage" : "currency") as
        "percentage" | "currency";

    const rawPeriod = (params.period || "30D").toUpperCase();
    const period: PeriodFilter = ["7D", "30D", "90D", "ALL"].includes(rawPeriod)
        ? (rawPeriod as PeriodFilter)
        : "30D";

    // Fetch active competition status from DB
    const activeCompetition = await getActiveCompetition();
    const hasActiveCompetition = Boolean(activeCompetition);

    // If user asked for sprint but no active competition exists, redirect to trading
    if (rawType === "sprint" && !hasActiveCompetition) {
        redirect("/dashboard/leaderboard?type=trading");
    }

    if (!VALID_TYPES.includes(rawType as LeaderboardType)) {
        redirect("/dashboard/leaderboard?type=trading");
    }

    const type = rawType as LeaderboardType;
    const user = await getAuthUser();

    // Fetch user enrollment and trading accounts if active competition exists
    let userEnrollment = null;
    let userAccounts: Array<{
        id: string;
        name: string;
        accountNumber?: string | null;
        broker?: string | null;
        balance?: number;
    }> = [];

    if (activeCompetition && user) {
        const [enrollment, accountsRes] = await Promise.all([
            getUserCompetitionEnrollment(activeCompetition.id),
            getTradingAccounts(1, 50),
        ]);
        userEnrollment = enrollment;
        userAccounts = accountsRes.accounts;
    }

    // For mystats, fetch XP leaderboard data to get rank info; for sprint, fetch trading data
    const fetchType = type === "mystats" ? "xp" : type;
    const leaderboard = await getLeaderboard(fetchType, 50, sortBy, period);
    const sidebarData = await getLeaderboardSidebarData();

    // Build myEntry for table display when user is not in top list
    const myEntry =
        leaderboard.myRank && user
            ? {
                  rank: leaderboard.myRank.rank,
                  userId: user.id,
                  name:
                      user.name ||
                      user.email?.split("@")[0] ||
                      "You",
                  avatar: user.image || null,
                  tier: getTier(leaderboard.myRank.tierProgress.current.minXp),
                  value: leaderboard.myRank.value,
                  label:
                      fetchType === "streak"
                          ? "days"
                          : fetchType === "academy"
                            ? "lessons"
                            : sortBy === "percentage"
                              ? "%"
                              : "$",
                  level: 0,
                  lessonsCompleted: 0,
                  studyTimeMinutes: 0,
                  percentile: leaderboard.myRank.percentile,
                  totalTrades: 0,
                  pnl: 0,
              }
            : null;

    const isMyStats = type === "mystats";

    return (
        <div className="space-y-6">
            <PageHeader
                title="Trading Arena & Leaderboard"
                description="Live institutional execution telemetry, monthly battles, and discipline rankings."
            />

            {/* Trading Sprint Banner (Dynamically shown ONLY when active competition exists) */}
            {type === "sprint" && activeCompetition && (
                <TradingSprintBanner
                    competition={activeCompetition}
                    userEnrollment={userEnrollment}
                    userAccounts={userAccounts}
                    isLoggedIn={Boolean(user)}
                />
            )}

            {/* Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Suspense fallback={null}>
                    <LeaderboardTabs
                        activeType={type}
                        hasActiveCompetition={hasActiveCompetition}
                    />
                </Suspense>
            </div>

            {/* Setup Prompt for Trading & Sprint */}
            {(type === "trading" || type === "sprint") &&
                user &&
                !leaderboard.hasLeaderboardAccount && <TradingSetupModal />}

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Leaderboard Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Content */}
                    {isMyStats ? (
                        <MyStatsView
                            myRank={leaderboard.myRank}
                            userName={
                                user?.name ||
                                user?.email?.split("@")[0] ||
                                undefined
                            }
                            userAvatar={user?.image || null}
                        />
                    ) : (
                        <LeaderboardContent
                            entries={leaderboard.data}
                            currentUserId={user?.id}
                            myEntry={myEntry}
                            type={type}
                            sortBy={sortBy}
                            period={period}
                        />
                    )}
                </div>

                {/* Right Column: Settings & Personal Stats Sidebar */}
                {user && (
                    <div className="lg:col-span-1">
                        <LeaderboardSidebar initialData={sidebarData} />
                    </div>
                )}
            </div>

            {/* Rank-Up Celebration */}
            <RankUpModal myRank={leaderboard.myRank} />
        </div>
    );
}
