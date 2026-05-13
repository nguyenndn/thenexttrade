
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSyncAuth } from "@/lib/sync-auth";

export async function GET(request: NextRequest) {
    try {
        const accountNumber = request.nextUrl.searchParams.get("accountNumber") || request.headers.get("X-Account-Number");

        const auth = await resolveSyncAuth({
            request,
            accountNumber,
            requireAccount: true,
        });

        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const account = auth.data.account!;

        // Get pending commands for this account
        // Must be PENDING and NOT expired
        const commands = await prisma.eaCommand.findMany({
            where: {
                tradingAccountId: account.id,
                status: "PENDING",
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: { createdAt: "asc" },
            take: 1, // Process one command at a time
        });

        // Mark as PROCESSING if found
        if (commands.length > 0) {
            await prisma.eaCommand.update({
                where: { id: commands[0].id },
                data: {
                    status: "PROCESSING",
                    startedAt: new Date(),
                },
            });
        }

        return NextResponse.json({
            commands: commands.map(cmd => ({
                id: cmd.id,
                type: cmd.type,
                params: cmd.params,
                createdAt: cmd.createdAt,
            })),
        });
    } catch (error) {
        console.error("Poll commands error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
