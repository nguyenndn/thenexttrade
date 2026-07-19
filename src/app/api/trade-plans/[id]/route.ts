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
            include: { account: true, journalEntry: true },
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
        const body = await request.json();
        const plan = await prisma.tradePlan.update({
            where: { id, userId: user.id },
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
                accountId: body.accountId,
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
        await prisma.tradePlan.delete({
            where: { id, userId: user.id },
        });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete plan" },
            { status: 500 }
        );
    }
}
