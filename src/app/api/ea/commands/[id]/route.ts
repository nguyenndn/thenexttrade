
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { z } from "zod";

const UpdateCommandSchema = z.object({
    status: z.enum(["COMPLETED", "FAILED"]),
    result: z.object({
        success: z.boolean(),
        syncedCount: z.number().optional(),
        message: z.string().optional(),
    }).optional(),
    errorMessage: z.string().optional(),
});

// PATCH: EA calls this to update status
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json({ error: "API key required" }, { status: 401 });
        }

        // Find trading account by API key
        const account = await prisma.tradingAccount.findUnique({
            where: { apiKey },
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        const body = await request.json();
        const validated = UpdateCommandSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid request", details: (validated.error as any).errors } as any, { status: 400 });
        }

        // Update command (only if belongs to this account and is PROCESSING)
        const command = await prisma.eaCommand.updateMany({
            where: {
                id: params.id,
                tradingAccountId: account.id,
                status: "PROCESSING",
            },
            data: {
                status: validated.data.status,
                result: validated.data.result || undefined,
                errorMessage: validated.data.errorMessage,
                completedAt: new Date(),
            },
        });

        if (command.count === 0) {
            return NextResponse.json({
                error: "Command not found or not in PROCESSING status"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Command result recorded",
        });
    } catch (error) {
        console.error("Update command error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET: Web UI polls this to get status
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const command = await prisma.eaCommand.findUnique({
            where: { id: params.id },
        });

        if (!command) {
            return NextResponse.json({ error: "Command not found" } as any, { status: 404 });
        }

        // Check ownership
        if (command.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ command });
    } catch (error) {
        console.error("Get command error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
