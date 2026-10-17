import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const plan = await prisma.tradePlan.findFirst({
            where: { id, userId: user.id },
            include: {
                account: { select: { id: true, name: true } },
                journalEntry: true,
            },
        });

        if (!plan)
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        return NextResponse.json(plan);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch plan" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.tradePlan.findFirst({
            where: { id, userId: user.id },
            select: { id: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const normalizedAccountId =
            body.accountId === undefined
                ? undefined
                : !body.accountId || body.accountId === "none"
                  ? null
                  : String(body.accountId);

        if (normalizedAccountId) {
            const acct = await prisma.tradingAccount.findFirst({
                where: { id: normalizedAccountId, userId: user.id },
                select: { id: true },
            });
            if (!acct) {
                return NextResponse.json(
                    { error: "Invalid trading account" },
                    { status: 403 }
                );
            }
        }

        const plan = await prisma.tradePlan.update({
            where: { id },
            data: {
                symbol: body.symbol,
                type: body.type,
                plannedEntry: body.plannedEntry,
                plannedStopLoss: body.plannedStopLoss,
                plannedTakeProfit: body.plannedTakeProfit,
                plannedLotSize: body.plannedLotSize,
                riskAmount: body.riskAmount,
                setupName: body.setupName,
                thesis: body.thesis,
                invalidation: body.invalidation,
                emotionBefore: body.emotionBefore,
                confidenceLevel: body.confidenceLevel,
                ruleChecklist: body.ruleChecklist,
                ...(normalizedAccountId !== undefined
                    ? { accountId: normalizedAccountId }
                    : {}),
                status: body.status,
            },
        });

        return NextResponse.json(plan);
    } catch {
        return NextResponse.json(
            { error: "Failed to update plan" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const deleted = await prisma.tradePlan.deleteMany({
            where: { id, userId: user.id },
        });
        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete plan" },
            { status: 500 }
        );
    }
}
