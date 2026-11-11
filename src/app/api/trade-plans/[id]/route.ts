import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateTradePlanSchema = z.object({
    symbol: z.string().min(1).max(30).optional(),
    type: z.enum(["BUY", "SELL"]).nullable().optional(),
    plannedEntry: z.number().min(0).nullable().optional(),
    plannedStopLoss: z.number().min(0).nullable().optional(),
    plannedTakeProfit: z.number().min(0).nullable().optional(),
    plannedLotSize: z.number().min(0).nullable().optional(),
    riskAmount: z.number().min(0).nullable().optional(),
    setupName: z.string().max(120).nullable().optional(),
    thesis: z.string().nullable().optional(),
    invalidation: z.string().nullable().optional(),
    emotionBefore: z.string().max(50).nullable().optional(),
    confidenceLevel: z.number().int().min(1).max(5).nullable().optional(),
    ruleChecklist: z.unknown().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    accountId: z.string().nullable().optional(),
    status: z
        .enum(["PLANNED", "ACTIVE", "MATCHED", "REVIEWED", "CANCELLED"])
        .optional(),
});

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
        const parsed = updateTradePlanSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid trade plan details",
                    details: parsed.error.issues,
                },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const normalizedAccountId =
            data.accountId === undefined
                ? undefined
                : !data.accountId || data.accountId === "none"
                  ? null
                  : data.accountId;

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
                symbol: data.symbol,
                type: data.type,
                plannedEntry: data.plannedEntry,
                plannedStopLoss: data.plannedStopLoss,
                plannedTakeProfit: data.plannedTakeProfit,
                plannedLotSize: data.plannedLotSize,
                riskAmount: data.riskAmount,
                setupName: data.setupName,
                thesis: data.thesis,
                invalidation: data.invalidation,
                emotionBefore: data.emotionBefore,
                confidenceLevel: data.confidenceLevel,
                ruleChecklist:
                    data.ruleChecklist === undefined
                        ? undefined
                        : data.ruleChecklist === null
                          ? Prisma.JsonNull
                          : (data.ruleChecklist as Prisma.InputJsonValue),
                tags: data.tags,
                images: data.images,
                ...(normalizedAccountId !== undefined
                    ? { accountId: normalizedAccountId }
                    : {}),
                status: data.status,
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
