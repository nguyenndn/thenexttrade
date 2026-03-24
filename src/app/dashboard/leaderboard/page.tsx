import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, type LeaderboardType } from "./actions";
import { LeaderboardTabs } from "./components/LeaderboardTabs";
import { LeaderboardContent } from "./components/LeaderboardContent";
import { MyStatsView } from "./components/MyStatsView";
import { TradingSetupModal } from "./components/TradingSetupModal";
import { RankUpModal } from "./components/RankUpModal";

import { getTier } from "@/lib/gamification";
import { PageHeader } from "@/components/ui/PageHeader";

const VALID_TYPES: LeaderboardType[] = ["xp", "streak", "academy", "trading", "mystats"];

export const metadata = {
  title: "Leaderboard | TheNextTrade",
  description:
    "See where you stand in the community. Track your XP, streak, and trading performance.",
};

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawType = params.type || "xp";

  if (!VALID_TYPES.includes(rawType as LeaderboardType)) {
    redirect("/dashboard/leaderboard?type=xp");
  }

  const type = rawType as LeaderboardType;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For mystats, fetch XP leaderboard data to get rank info
  const fetchType = type === "mystats" ? "xp" : type;
  const leaderboard = await getLeaderboard(fetchType, 50);

  // Build myEntry for table display when user is not in top list
  const myEntry = leaderboard.myRank && user
    ? {
        rank: leaderboard.myRank.rank,
        userId: user.id,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "You",
        avatar: user.user_metadata?.avatar_url || null,
        tier: getTier(leaderboard.myRank.tierProgress.current.minXp),
        value: leaderboard.myRank.value,
        label: fetchType === "xp" ? "XP" : fetchType === "streak" ? "days" : fetchType === "academy" ? "lessons" : "%",
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
        title="Leaderboard"
        description="See where you stand in the community."
      />

      {/* Tabs */}
      <Suspense fallback={null}>
        <LeaderboardTabs activeType={type} />
      </Suspense>

      {/* Setup Prompt for Trading */}
      {type === "trading" && user && !leaderboard.hasLeaderboardAccount && (
        <TradingSetupModal />
      )}

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
        />
      )}

      {/* Rank-Up Celebration */}
      <RankUpModal myRank={leaderboard.myRank} />
    </div>
  );
}
