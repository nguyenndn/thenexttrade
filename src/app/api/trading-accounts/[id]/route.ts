import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

// GET - Get account details
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

        const account = await prisma.tradingAccount.findFirst({
            where: { id: params.id, userId: user.id },
            include: {
                syncHistory: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: { journalEntries: true }, // Changed from 'trades' to 'journalEntries' to match schema
                },
            },
        });

        if (!account) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...account,
            apiKey: undefined, // Never expose
            maskedApiKey: account.apiKey ? `${account.apiKey.substring(0, 8)}...${account.apiKey.substring(account.apiKey.length - 4)}` : null,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
    }
}

// PATCH - Update account
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, broker, autoSync, color } = body;

        const account = await prisma.tradingAccount.updateMany({
            where: { id: params.id, userId: user.id },
            data: { name, broker, autoSync, color },
        });

        if (account.count === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }
}

// DELETE - Remove account
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.tradingAccount.deleteMany({
            where: { id: params.id, userId: user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
