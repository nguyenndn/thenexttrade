import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { deleteTradingAccount } from "@/actions/accounts";

const UpdateTradingAccountSchema = z
    .object({
        name: z.string().trim().min(1).max(120).optional(),
        broker: z.string().trim().max(120).nullable().optional(),
        server: z.string().trim().max(160).nullable().optional(),
        accountNumber: z.string().trim().max(64).nullable().optional(),
        autoSync: z.boolean().optional(),
        color: z.string().trim().max(32).nullable().optional(),
    })
    .strict();

// GET - Get account details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
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
            maskedApiKey: account.apiKey
                ? `${account.apiKey.substring(0, 8)}...${account.apiKey.substring(account.apiKey.length - 4)}`
                : null,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch account" },
            { status: 500 }
        );
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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const parsed = UpdateTradingAccountSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid request payload",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const existingAccount = await prisma.tradingAccount.findFirst({
            where: { id: params.id, userId: user.id },
            select: {
                id: true,
                platform: true,
                accountNumber: true,
            },
        });

        if (!existingAccount) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const nextAccountNumber =
            parsed.data.accountNumber !== undefined
                ? parsed.data.accountNumber?.trim() || null
                : existingAccount.accountNumber?.trim() || null;

        if (
            nextAccountNumber &&
            nextAccountNumber !== (existingAccount.accountNumber?.trim() || null)
        ) {
            const duplicate = await prisma.tradingAccount.findFirst({
                where: {
                    userId: user.id,
                    platform: existingAccount.platform,
                    accountNumber: nextAccountNumber,
                    id: { not: params.id },
                },
                select: { id: true },
            });

            if (duplicate) {
                return NextResponse.json(
                    {
                        error: `Account number #${nextAccountNumber} is already registered under your profile.`,
                    },
                    { status: 409 }
                );
            }
        }

        await prisma.tradingAccount.update({
            where: { id: params.id },
            data: {
                ...(parsed.data.name !== undefined
                    ? { name: parsed.data.name }
                    : {}),
                ...(parsed.data.broker !== undefined
                    ? { broker: parsed.data.broker || null }
                    : {}),
                ...(parsed.data.server !== undefined
                    ? { server: parsed.data.server || null }
                    : {}),
                ...(parsed.data.accountNumber !== undefined
                    ? { accountNumber: nextAccountNumber }
                    : {}),
                ...(parsed.data.autoSync !== undefined
                    ? { autoSync: parsed.data.autoSync }
                    : {}),
                ...(parsed.data.color ? { color: parsed.data.color } : {}),
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard/trading-systems");
        revalidateTag("dashboard-stats", "max");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update account" },
            { status: 500 }
        );
    }
}

// DELETE - Remove account
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const result = await deleteTradingAccount(params.id);

        if (!result.success) {
            if (result.error === "Unauthorized") {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }
            if (result.error === "Account not found") {
                return NextResponse.json(
                    { error: "Not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: result.error || "Failed to delete account" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}
