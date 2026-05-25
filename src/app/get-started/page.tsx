import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PublicGetStarted } from "@/components/get-started/PublicGetStarted";
import { OnboardingChecklist } from "@/components/get-started/OnboardingChecklist";
import type { UserProgress } from "@/components/get-started/OnboardingChecklist";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — TheNextTrade Trading Journal",
  description:
    "Set up your free trading journal in minutes. Connect your MT5 account, auto-sync trades, and start improving with AI-powered insights and gamified missions.",
};

export const dynamic = "force-dynamic";

export default async function GetStartedPage() {
  const user = await getAuthUser();

  // ─── PUBLIC VIEW (not logged in) ───
  if (!user) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0B0E14] overflow-hidden">
        <PublicHeader user={user} />
        <PublicGetStarted />
        <SiteFooter />
      </main>
    );
  }

  // ─── PRIVATE VIEW (logged in) → fetch user progress ───
  const [accountData, journalCount, missionCount] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId: user.id },
      select: { id: true, totalTrades: true },
    }),
    prisma.journalEntry.count({
      where: { userId: user.id },
    }),
    prisma.userMissionProgress.count({
      where: { userId: user.id, completedAt: { not: null } },
    }),
  ]);

  const totalAccountTrades = accountData.reduce((sum: number, a: { totalTrades: number }) => sum + a.totalTrades, 0);

  const progress: UserProgress = {
    userName: user.name || user.profile?.username || "",
    hasProfile: !!(user.profile?.username && user.name),
    hasAccount: accountData.length > 0,
    hasFirstTrade: journalCount > 0 || totalAccountTrades > 0,
    hasMissionComplete: missionCount > 0,
    totalAccounts: accountData.length,
    totalTrades: journalCount || totalAccountTrades,
    totalMissions: missionCount,
    xp: user.profile?.xp ?? 0,
    level: user.profile?.level ?? 1,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#0B0E14] overflow-hidden">
      <PublicHeader user={user} />
      <OnboardingChecklist progress={progress} />
      <SiteFooter />
    </main>
  );
}
