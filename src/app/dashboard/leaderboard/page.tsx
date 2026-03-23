import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, type LeaderboardType } from "./actions";
import { LeaderboardTabs } from "./components/LeaderboardTabs";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { TopPodium } from "./components/TopPodium";
import { MyRankCard } from "./components/MyRankCard";
import { RankUpModal } from "./components/RankUpModal";

import { getTier } from "@/lib/gamification";
import { PageHeader } from "@/components/ui/PageHeader";

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
  const type = (params.type as LeaderboardType) || "xp";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leaderboard = await getLeaderboard(type, 50);

  // Build myEntry for table display when user is not in top list
  const myEntry = leaderboard.myRank && user
    ? {
        rank: leaderboard.myRank.rank,
        userId: user.id,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "You",
        avatar: user.user_metadata?.avatar_url || null,
        tier: getTier(leaderboard.myRank.tierProgress.current.minXp),
        value: leaderboard.myRank.value,
        label: type === "xp" ? "XP" : type === "streak" ? "days" : type === "academy" ? "lessons" : "%",
      }
    : null;

  return (
    <div className="space-y-4">
      {/* PageHeader */}
      <PageHeader
        title="Leaderboard"
        description="See where you stand in the community."
      />



      {/* Tabs */}
      <Suspense fallback={null}>
        <LeaderboardTabs activeType={type} equalWidth />
      </Suspense>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-4">
          <TopPodium
            entries={leaderboard.data.slice(0, 3)}
            currentUserId={user?.id}
          />

          <LeaderboardTable
            entries={leaderboard.data.slice(3)}
            currentUserId={user?.id}
            myEntry={
              leaderboard.data.some((e) => e.userId === user?.id)
                ? null
                : myEntry
            }
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <MyRankCard
            myRank={leaderboard.myRank}
            rivals={leaderboard.rivals}
          />
        </div>
      </div>

      {/* Rank-Up Celebration */}
      <RankUpModal myRank={leaderboard.myRank} />
    </div>
  );
}
