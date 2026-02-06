
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
    entryDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    exitDate: z.string().or(z.date()).optional().nullable().transform((val) => val ? new Date(val) : null),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    result: z.enum(["WIN", "LOSS", "BREAK_EVEN"]).optional().nullable(),
    pnl: z.number().optional().nullable(),
    notes: z.string().optional(),
    entryReason: z.string().optional(),
    exitReason: z.string().optional(),
    images: z.array(z.string()).optional(),
    strategy: z.string().optional().nullable(),
    mistakes: z.array(z.string()).optional(),
});

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const entry = await prisma.journalEntry.findUnique({
            where: { id: params.id }
        });

        if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.journalEntry.findUnique({
            where: { id: params.id },
            select: { userId: true }
        });

        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (existing.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const validatedData = journalEntryUpdateSchema.parse(body);

        const updated = await prisma.journalEntry.update({
            where: { id: params.id },
            data: validatedData
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.journalEntry.findUnique({ where: { id: params.id }, select: { userId: true } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (existing.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.journalEntry.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
