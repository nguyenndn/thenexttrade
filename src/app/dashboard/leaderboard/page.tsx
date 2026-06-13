import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, getLeaderboardSidebarData, type LeaderboardType } from "./actions";
import { LeaderboardTabs } from "./components/LeaderboardTabs";
import { LeaderboardContent } from "./components/LeaderboardContent";
import { MyStatsView } from "./components/MyStatsView";
import { TradingSetupModal } from "./components/TradingSetupModal";
import { RankUpModal } from "./components/RankUpModal";
import { LeaderboardSidebar } from "./components/LeaderboardSidebar";

import { getTier } from "@/lib/gamification";
import { PageHeader } from "@/components/ui/PageHeader";

const VALID_TYPES: LeaderboardType[] = ["xp", "streak", "academy", "trading", "mystats"];

export const metadata = {
 title: "Leaderboard | TheNextTrade",
 description:
 "See where you stand in the community. Track your Edge, streak, and trading performance.",
};

interface PageProps {
 searchParams: Promise<{ type?: string; sortBy?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
 const params = await searchParams;
 const rawType = params.type || "trading";
 const rawSortBy = params.sortBy || "currency";
 const sortBy = (rawSortBy === "percentage" ? "percentage" : "currency") as "percentage" | "currency";

 if (!VALID_TYPES.includes(rawType as LeaderboardType)) {
 redirect("/dashboard/leaderboard?type=trading");
 }

 const type = rawType as LeaderboardType;
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 // For mystats, fetch XP leaderboard data to get rank info
 const fetchType = type === "mystats" ? "xp" : type;
 const leaderboard = await getLeaderboard(fetchType, 50, sortBy);
 const sidebarData = await getLeaderboardSidebarData();

 // Build myEntry for table display when user is not in top list
 const myEntry = leaderboard.myRank && user
 ? {
 rank: leaderboard.myRank.rank,
 userId: user.id,
 name: user.user_metadata?.full_name || user.email?.split("@")[0] || "You",
 avatar: user.user_metadata?.avatar_url || null,
 tier: getTier(leaderboard.myRank.tierProgress.current.minXp),
 value: leaderboard.myRank.value,
 label: fetchType === "xp" ? "Edge" : fetchType === "streak" ? "days" : fetchType === "academy" ? "lessons" : (sortBy === "percentage" ? "%" : "$"),
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
 <div className="space-y-4">
 <PageHeader
 title="Leaderboard"
 description="See where you stand in the community."
 />

 {/* Tabs */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <Suspense fallback={null}>
 <LeaderboardTabs activeType={type} />
 </Suspense>
 </div>

 {/* Setup Prompt for Trading */}
 {type === "trading" && user && !leaderboard.hasLeaderboardAccount && (
 <TradingSetupModal />
 )}

 {/* Main Grid Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
 {/* Left Column: Leaderboard Content */}
 <div className="lg:col-span-2 space-y-6">
 {/* Content */}
 {isMyStats ? (
 <MyStatsView
 myRank={leaderboard.myRank}
 userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || undefined}
 userAvatar={user?.user_metadata?.avatar_url || null}
 />
 ) : (
 <LeaderboardContent
 entries={leaderboard.data}
 currentUserId={user?.id}
 myEntry={myEntry}
 type={type}
 sortBy={sortBy}
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
