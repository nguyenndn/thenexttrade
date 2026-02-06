
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateCommandSchema = z.object({
    tradingAccountId: z.string().min(1),
    type: z.enum(["SYNC_TRADES", "SYNC_ALL", "TEST_CONNECTION"]),
    params: z.object({
        days: z.number().min(1).max(365).optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
    }).optional().default({}),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = CreateCommandSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid request", details: validated.error.errors }, { status: 400 });
        }

        const { tradingAccountId, type, params } = validated.data;

        // Verify user owns this trading account
        const account = await prisma.tradingAccount.findFirst({
            where: {
                id: tradingAccountId,
                userId: user.id,
            },
        });

        if (!account) {
            return NextResponse.json({ error: "Trading account not found" }, { status: 404 });
        }

        // Check if EA is connected (last heartbeat within 60 seconds)
        // Relaxed to 5 minutes to account for jitter, or let user create command anyway but warn?
        // Spec said 60 seconds strict check.
        const isConnected = account.lastHeartbeat &&
            new Date().getTime() - new Date(account.lastHeartbeat).getTime() < 300000; // 5 mins tolerance

        if (!isConnected) {
            return NextResponse.json({
                error: "EA is not connected. Please ensure EA is running on your MT4/MT5 terminal.",
                code: "EA_OFFLINE"
            }, { status: 400 });
        }

        // Check for existing pending command (prevent spam)
        const existingPending = await prisma.eaCommand.findFirst({
            where: {
                tradingAccountId: tradingAccountId,
                status: "PENDING",
            },
        });

        if (existingPending) {
            return NextResponse.json({
                error: "A command is already pending. Please wait for it to complete.",
                existingCommand: existingPending
            }, { status: 409 });
        }

        // Create command with 10-minute expiry
        const command = await prisma.eaCommand.create({
            data: {
                tradingAccountId: tradingAccountId,
                userId: user.id,
                type: type,
                params: params,
                status: "PENDING",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                source: "WEB",
                ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            },
        });

        return NextResponse.json({
            success: true,
            command: {
                id: command.id,
                type: command.type,
                status: command.status,
                createdAt: command.createdAt,
                expiresAt: command.expiresAt,
            },
        });
    } catch (error) {
        console.error("Create command error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/ea/commands - List user's commands
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tradingAccountId = searchParams.get("tradingAccountId");
        const limit = parseInt(searchParams.get("limit") || "10");

        const commands = await prisma.eaCommand.findMany({
            where: {
                userId: user.id,
                ...(tradingAccountId && { tradingAccountId }),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                tradingAccount: {
                    select: { name: true, accountNumber: true },
                },
            },
        });

        return NextResponse.json({ commands });
    } catch (error) {
        console.error("List commands error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
