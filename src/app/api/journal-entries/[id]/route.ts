import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Partial validation for updates
const journalEntryUpdateSchema = z.object({
    symbol: z.string().toUpperCase().optional(),
    type: z.enum(["BUY", "SELL"]).optional(),
    entryPrice: z.number().positive().optional(),
    exitPrice: z.number().positive().optional().nullable(),
    stopLoss: z.number().positive().optional().nullable(),
    takeProfit: z.number().positive().optional().nullable(),
    lotSize: z.number().positive().optional(),
    entryDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val))
        .refine((d) => !isNaN(d.getTime()), "Invalid entry date")
        .optional(),
    exitDate: z
        .string()
        .or(z.date())
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : null))
        .refine((d) => d === null || !isNaN(d.getTime()), "Invalid exit date"),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    result: z.enum(["WIN", "LOSS", "BREAK_EVEN"]).optional().nullable(),
    pnl: z.number().optional().nullable(),
    commission: z.number().optional().nullable(),
    swap: z.number().optional().nullable(),
    notes: z.string().optional(),
    entryReason: z.string().optional().nullable(),
    exitReason: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    strategy: z.string().optional().nullable(),
    mistakes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    accountId: z.string().optional().nullable(),
    emotionBefore: z.string().optional().nullable(),
    emotionAfter: z.string().optional().nullable(),
    confidenceLevel: z.number().int().min(1).max(5).optional().nullable(),
    followedPlan: z.boolean().optional().nullable(),
    playbookGrade: z.string().max(10).optional().nullable(),
    playbookComplianceScore: z.number().min(0).max(100).optional().nullable(),
    notesPsychology: z.string().optional().nullable(),
    ruleChecks: z
        .array(
            z.object({
                tradingRuleId: z.string(),
                status: z.enum(["FOLLOWED", "BROKEN", "SKIPPED"]),
                note: z.string().optional().nullable(),
            })
        )
        .optional(),
    tradePlanId: z.string().optional().nullable(),
});

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const entry = await prisma.journalEntry.findUnique({
            where: { id: params.id },
            include: {
                ruleChecks: true,
                tradePlan: {
                    include: {
                        tradeCheckSnapshot: true,
                    },
                },
            },
        });

        if (!entry)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Ownership check
        if (entry.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(entry);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.journalEntry.findUnique({
            where: { id: params.id },
            select: {
                userId: true,
                entryDate: true,
                exitDate: true,
                result: true,
                pnl: true,
                commission: true,
                swap: true,
            },
        });

        if (!existing)
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (existing.userId !== user.id)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        if (body.accountId === "none" || body.accountId === "") {
            body.accountId = null;
        }
        const validatedData = journalEntryUpdateSchema.parse(body);

        // accountId must stay within the user's own accounts
        if ("accountId" in body && body.accountId) {
            const acct = await prisma.tradingAccount.findFirst({
                where: { id: body.accountId as string, userId: user.id },
                select: { id: true },
            });
            if (!acct)
                return NextResponse.json(
                    { error: "Invalid account" },
                    { status: 400 }
                );
        }

        // CRITICAL: Only update fields that were explicitly sent in the request body.
        // Zod transforms can convert undefined (absent field) to null,
        // which would unintentionally overwrite existing DB values (e.g. exitDate → null).
        const updateData: Record<string, unknown> = {};
        const validated = validatedData as Record<string, unknown>;
        for (const key of Object.keys(validated)) {
            if (key in body && key !== "ruleChecks" && key !== "tradePlanId") {
                updateData[key] = validated[key];
            }
        }

        if (updateData.status === "CLOSED") {
            if (!updateData.exitDate && !existing.exitDate) {
                updateData.exitDate =
                    (updateData.entryDate as Date) || existing.entryDate;
            }
            const effectivePnl =
                typeof updateData.pnl === "number"
                    ? updateData.pnl
                    : existing.pnl;
            if (
                !updateData.result &&
                !existing.result &&
                typeof effectivePnl === "number"
            ) {
                const effComm =
                    typeof updateData.commission === "number"
                        ? updateData.commission
                        : existing.commission || 0;
                const effSwap =
                    typeof updateData.swap === "number"
                        ? updateData.swap
                        : existing.swap || 0;
                const netPnl = effectivePnl + effComm + effSwap;
                updateData.result =
                    netPnl > 0 ? "WIN" : netPnl < 0 ? "LOSS" : "BREAK_EVEN";
            }
        }

        const updated = await prisma.journalEntry.update({
            where: { id: params.id },
            data: updateData,
        });

        if ("ruleChecks" in body && Array.isArray(body.ruleChecks)) {
            await prisma.tradeRuleCheck.deleteMany({
                where: { journalEntryId: params.id, userId: user.id },
            });

            if (body.ruleChecks.length > 0) {
                const requestedRuleIds = Array.from(
                    new Set(body.ruleChecks.map((c: any) => c.tradingRuleId))
                ) as string[];
                const ownedRules = await prisma.tradingRule.findMany({
                    where: { id: { in: requestedRuleIds }, userId: user.id },
                    select: { id: true },
                });
                const ownedRuleIdSet = new Set(ownedRules.map((r) => r.id));
                const validRuleChecks = body.ruleChecks.filter((c: any) =>
                    ownedRuleIdSet.has(c.tradingRuleId)
                );

                if (validRuleChecks.length > 0) {
                    await prisma.tradeRuleCheck.createMany({
                        data: validRuleChecks.map((c: any) => ({
                            userId: user.id,
                            journalEntryId: params.id,
                            tradingRuleId: c.tradingRuleId,
                            status: c.status,
                            note: c.note || null,
                        })),
                    });
                }
            }
        }

        if ("tradePlanId" in body) {
            const tradePlanId = body.tradePlanId;
            await prisma.tradePlan.updateMany({
                where: { journalEntryId: params.id, userId: user.id },
                data: { journalEntryId: null, status: "PLANNED" },
            });

            if (tradePlanId) {
                await prisma.tradePlan.updateMany({
                    where: { id: tradePlanId, userId: user.id },
                    data: {
                        journalEntryId: params.id,
                        status: "MATCHED",
                        openedAt: new Date(),
                    },
                });
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.journalEntry.findUnique({
            where: { id: params.id },
            select: {
                userId: true,
                entryDate: true,
                exitDate: true,
                result: true,
                pnl: true,
                commission: true,
                swap: true,
            },
        });
        if (!existing)
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (existing.userId !== user.id)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Detach any MATCHED trade plan first — the DB SetNull would leave
        // it orphaned at status "MATCHED" pointing at a deleted entry.
        await prisma.tradePlan.updateMany({
            where: { journalEntryId: params.id, userId: user.id },
            data: { journalEntryId: null, status: "PLANNED" },
        });

        await prisma.journalEntry.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
