import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PublicGetStarted } from "@/components/get-started/PublicGetStarted";
import { OnboardingChecklist } from "@/components/get-started/OnboardingChecklist";
import type { UserProgress } from "@/components/get-started/OnboardingChecklist";

export const metadata: Metadata = {
 title: "Get Started - TheNextTrade",
 description:
 "Start your TheNextTrade workspace, connect MT5, sync your first trade, and begin reviewing your trading edge.",
};

export const dynamic = "force-dynamic";

export default async function GetStartedPage() {
 const user = await getAuthUser();

 if (!user) {
 return (
 <main className="min-h-screen overflow-hidden bg-[#F7F4EC] dark:bg-transparent text-slate-950 dark:text-white relative">
 <PublicHeader user={user} />
 <PublicGetStarted />
 <SiteFooter />
 </main>
 );
 }

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

 const totalAccountTrades = accountData.reduce((sum, account) => sum + account.totalTrades, 0);
 const totalTrades = journalCount || totalAccountTrades;

 const progress: UserProgress = {
 userName: user.name || user.profile?.username || "",
 hasProfile: Boolean(user.profile?.username && user.name),
 hasAccount: accountData.length > 0,
 hasFirstTrade: totalTrades > 0,
 hasMissionComplete: missionCount > 0,
 totalAccounts: accountData.length,
 totalTrades,
 totalMissions: missionCount,
 xp: user.profile?.xp ?? 0,
 level: user.profile?.level ?? 1,
 };

 return (
 <main className="min-h-screen overflow-hidden bg-[#F7F4EC] dark:bg-transparent text-slate-950 dark:text-white relative">
 <PublicHeader user={user} />
 <OnboardingChecklist progress={progress} />
 <SiteFooter />
 </main>
 );
}
