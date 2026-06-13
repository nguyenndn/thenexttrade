import { NextRequest, NextResponse } from "next/server";
import { getUserProAccess, getAccountProAccess } from "@/lib/pro-access";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
 const auth = await requireAuth();
 if (auth instanceof NextResponse) return auth;

 const accountId = request.nextUrl.searchParams.get("accountId");

 // Single account check
 if (accountId) {
 const result = await getAccountProAccess(auth.user.id, accountId);
 return NextResponse.json({
 isPro: result.isPro,
 status: result.status,
 source: result.source,
 expiresAt: result.expiresAt?.toISOString() || null,
 });
 }

 // User aggregate + accounts list
 const [result, profile] = await Promise.all([
 getUserProAccess(auth.user.id),
 prisma.profile.findUnique({
 where: { userId: auth.user.id },
 select: { mainTradingAccountId: true },
 }),
 ]);

 return NextResponse.json({
 isPro: result.isPro,
 status: result.status,
 source: result.source,
 expiresAt: result.expiresAt?.toISOString() || null,
 activeAccountCount: result.activeAccountCount,
 mainAccountId: profile?.mainTradingAccountId || null,
 accounts: result.accounts.map((a) => ({
 tradingAccountId: a.tradingAccountId,
 accountName: a.accountName,
 broker: a.broker,
 status: a.status,
 isPro: a.isPro,
 source: a.source,
 expiresAt: a.expiresAt?.toISOString() || null,
 })),
 });
}
