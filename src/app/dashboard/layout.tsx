import { getAuthUser } from "@/lib/auth-cache";
import { getUserProAccess } from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "./layout.client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const user = await getAuthUser();
 const initialProStatus = user
 ? await Promise.all([
 getUserProAccess(user.id),
 prisma.profile.findUnique({
 where: { userId: user.id },
 select: { mainTradingAccountId: true },
 }),
 ]).then(([r, profile]) => ({
 isPro: r.isPro,
 status: r.status,
 source: r.source,
 expiresAt: r.expiresAt?.toISOString() ?? null,
 activeAccountCount: r.activeAccountCount,
 mainAccountId: profile?.mainTradingAccountId ?? null,
 accounts: r.accounts.map((a) => ({
 tradingAccountId: a.tradingAccountId,
 accountName: a.accountName,
 broker: a.broker,
 status: a.status,
 isPro: a.isPro,
 source: a.source,
 expiresAt: a.expiresAt?.toISOString() ?? null,
 })),
 }))
 : null;

 return (
 <DashboardLayoutClient user={user} initialProStatus={initialProStatus}>
 {children}
 </DashboardLayoutClient>
 );
}
