import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const [trades, ruleChecks, snapshots, rules] = await Promise.all([
            prisma.journalEntry.findMany({
                where: { userId: user.id },
                orderBy: { entryDate: "desc" },
            }),
            prisma.tradeRuleCheck.findMany({
                where: { userId: user.id },
            }),
            prisma.tradeCheckSnapshot.findMany({
                where: { userId: user.id },
            }),
            prisma.tradingRule.findMany({
                where: { userId: user.id },
            }),
        ]);

        const data = {
            user: {
                id: user.id,
                name: user.name,
            },
            exportDate: new Date().toISOString(),
            trades,
            rules,
            ruleChecks,
            snapshots,
        };

        return new NextResponse(JSON.stringify(data, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="thenexttrade-backup-${new Date().toISOString().split("T")[0]}.json"`,
            },
        });
    } catch (error) {
        console.error("Failed to generate JSON backup:", error);
        return NextResponse.json(
            { error: "Internal server error during backup generation." },
            { status: 500 }
        );
    }
}
