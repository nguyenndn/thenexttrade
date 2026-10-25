import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { manageBridgeRulesForAccount } from "@/lib/mt5-bridge/client.server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RuleSchema = z.object({
    accountId: z.string().min(1),
    operation: z.enum(["ADD", "REMOVE", "CLEAR", "SET_DAILY"]),
    ruleId: z.string().optional(),
    type: z
        .enum([
            "PRICE_BE",
            "PRICE_CLOSE",
            "DAILY_LOSS_LIMIT",
            "DAILY_PROFIT_TARGET",
        ])
        .optional(),
    symbol: z.string().optional(),
    targetPrice: z.number().optional(),
    percentValue: z.number().optional(),
    direction: z.enum(["ABOVE", "BELOW"]).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = RuleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid rule parameters." },
                { status: 400 }
            );
        }

        const owned = await prisma.tradingAccount.findFirst({
            where: { id: parsed.data.accountId, userId: user.id },
            select: { id: true },
        });
        if (!owned) {
            return NextResponse.json(
                { error: "Trading account not found." },
                { status: 404 }
            );
        }

        const res = await manageBridgeRulesForAccount({
            userId: user.id,
            accountId: owned.id,
            operation: parsed.data.operation,
            ruleId: parsed.data.ruleId,
            type: parsed.data.type,
            symbol: parsed.data.symbol,
            targetPrice: parsed.data.targetPrice,
            percentValue: parsed.data.percentValue,
            direction: parsed.data.direction,
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: res.error || "Failed to update rule." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            state: res.state,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Rule update error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
