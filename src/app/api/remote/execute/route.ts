import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { executeBridgeActionForAccount } from "@/lib/mt5-bridge/client.server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ExecuteSchema = z.object({
    accountId: z.string().min(1),
    action: z.enum([
        "BREAKEVEN_ALL",
        "BE_PLUS_2",
        "SECURE_25",
        "SECURE_50",
        "SECURE_70",
        "SECURE_PROFIT_50_PCT",
        "DERISK",
        "TRIM_2",
        "CUT_LOSS_5_PIPS",
        "CANCEL_ORDERS",
        "CLOSE_TICKET",
        "BREAKEVEN_TICKET",
        "SECURE_50_TICKET",
        "CLOSE_ALL",
    ]),
    ticket: z.number().optional(),
    symbol: z.string().optional(),
    value: z.number().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = ExecuteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid execution command parameters." },
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

        const result = await executeBridgeActionForAccount({
            userId: user.id,
            accountId: owned.id,
            action: parsed.data.action,
            ticket: parsed.data.ticket,
            symbol: parsed.data.symbol,
            value: parsed.data.value,
        });

        return NextResponse.json(result);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Execution failed";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
