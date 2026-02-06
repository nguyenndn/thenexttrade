
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createEntrySchema = z.object({
    symbol: z.string().min(1, "Symbol is required"),
    type: z.enum(["BUY", "SELL"]),
    entryPrice: z.number().positive(),
    exitPrice: z.number().positive().optional(),
    lotSize: z.number().positive(),
    pnl: z.number().optional(),
    status: z.enum(["OPEN", "CLOSED"]),
    entryDate: z.string().transform((str) => new Date(str)),
    notes: z.string().optional(),
});

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Optional filter

    // Basic query - fetch recent 100 entries or filter by month if needed
    // For MVP, just fetching all for the user
    try {
        const entries = await prisma.journalEntry.findMany({
            where: { userId: user.id },
            orderBy: { entryDate: "desc" },
            take: 100
        });

        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validatedData = createEntrySchema.parse(body);

        // Ensure user exists in Prisma (Sync fallback)
        const userExists = await prisma.user.findUnique({ where: { id: user.id } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    image: user.user_metadata?.avatar_url
                }
            });
        }

        const entry = await prisma.journalEntry.create({
            data: {
                userId: user.id,
                images: [], // Explicitly empty array
                ...validatedData
            }
        });

        return NextResponse.json(entry);

    } catch (error: any) {
        console.error("JOURNAL POST ERROR:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
