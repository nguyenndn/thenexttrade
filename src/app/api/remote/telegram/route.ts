import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TelegramSchema = z.object({
    telegramId: z.string().max(50),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = TelegramSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid Telegram username." },
                { status: 400 }
            );
        }

        const clean = parsed.data.telegramId.trim().replace(/^@/, "");
        await prisma.profile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                telegramId: clean ? `@${clean}` : null,
            },
            update: {
                telegramId: clean ? `@${clean}` : null,
            },
        });

        return NextResponse.json({
            success: true,
            telegramId: clean ? `@${clean}` : "",
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save Telegram";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
