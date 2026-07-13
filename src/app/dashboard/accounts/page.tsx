import { Metadata } from "next";

export const metadata: Metadata = {
 title: "Trading Accounts | TheNextTrade",
 description: "Manage your trading accounts and Trade Manager EA sync",
};

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { AccountListClient } from "@/components/trading-accounts/AccountListClient";
import { getTradingAccounts } from "@/actions/accounts";
import { prisma } from "@/lib/prisma";

export default async function TradingAccountsPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const user = await getAuthUser();
 if (!user) redirect("/auth/login");

 const resolvedParams = await searchParams;
 const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
 const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 12;

 const [{ accounts, meta }, profile, dbUser] = await Promise.all([
 getTradingAccounts(page, limit),
 prisma.profile.findUnique({
 where: { userId: user.id },
 select: { mainTradingAccountId: true, telegramId: true, country: true },
 }),
 prisma.user.findUnique({
 where: { id: user.id },
 select: { settings: true },
 }),
 ]);

 const settings = (dbUser?.settings as Record<string, unknown>) || {};
 const onboarding = (settings.onboarding as Record<string, unknown>) || {};
 const preferredSyncMethod =
 onboarding.preferredSyncMethod === "EA_SYNC" ||
 onboarding.preferredSyncMethod === "MANUAL"
 ? onboarding.preferredSyncMethod
 : undefined;

 // Auto-set first account as main if user hasn't set one yet
 let mainAccountId = profile?.mainTradingAccountId ?? null;
 if (!mainAccountId && accounts.length > 0) {
 mainAccountId = accounts[0].id;
 // Fire-and-forget: persist silently
 prisma.profile.upsert({
 where: { userId: user.id },
 create: { userId: user.id, mainTradingAccountId: mainAccountId },
 update: { mainTradingAccountId: mainAccountId },
 }).catch(() => {});
 }

 return (
 <AccountListClient 
 initialAccounts={accounts} 
 meta={meta} 
 userEmail={user.email || ""} 
 userName={user.name ? user.name : undefined}
 userTelegramId={profile?.telegramId || undefined}
 userCountry={profile?.country || undefined}
 mainAccountId={mainAccountId}
 preferredSyncMethod={preferredSyncMethod}
 />
 );
}
