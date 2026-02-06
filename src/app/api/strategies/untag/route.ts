import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const untagSchema = z.object({
    name: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = untagSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data" },
                { status: 400 }
            );
        }

        const { name } = validation.data;

        // Untag all trades with this strategy name
        await prisma.journalEntry.updateMany({
            where: {
                userId: user.id,
                strategy: name,
            },
            data: {
                strategy: null,
            },
        });

        return NextResponse.json({ success: true, message: "Trades untagged" });
    } catch (error) {
        console.error("Untag strategy error:", error);
        return NextResponse.json({ error: "Failed to untag trades" }, { status: 500 });
    }
}
