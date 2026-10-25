import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    connectBridgeAccountForUser,
    disconnectBridgeAccountById,
    ensureAccountConnectedOnBridge,
} from "@/lib/mt5-bridge/client.server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ConnectSchema = z.object({
    accountId: z.string().optional(),
    login: z.union([z.string(), z.number()]).optional(),
    password: z.string().optional(),
    server: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = ConnectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid connection request payload." },
                { status: 400 }
            );
        }

        const { accountId, login, password, server } = parsed.data;

        // 1-Click Direct Connect for an existing account that already has stored credentials
        if (accountId && (!password || !password.trim())) {
            const ownedAcc = await prisma.tradingAccount.findFirst({
                where: { id: accountId, userId: user.id },
                include: { credential: true },
            });

            if (!ownedAcc) {
                return NextResponse.json(
                    { error: "Trading account not found." },
                    { status: 404 }
                );
            }

            if (!ownedAcc.credential?.encryptedPassword) {
                return NextResponse.json(
                    {
                        error: "Please enter the MT5 password once to connect this account.",
                        needsPassword: true,
                    },
                    { status: 400 }
                );
            }

            if (ownedAcc.status === "DISCONNECTED") {
                await prisma.tradingAccount.update({
                    where: { id: ownedAcc.id },
                    data: { status: "ACTIVE" },
                });
            }

            const ensured = await ensureAccountConnectedOnBridge(ownedAcc.id);
            if (!ensured.ok || !ensured.state) {
                return NextResponse.json(
                    {
                        error:
                            ensured.error ||
                            "Failed to connect existing MT5 account.",
                        needsPassword: true,
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                account: { id: ownedAcc.id },
                state: ensured.state,
            });
        }

        // Resolve login & server from existing accountId if not explicitly provided
        let resolvedLogin = login ? String(login).trim() : "";
        let resolvedServer = server ? server.trim() : "";

        if (accountId && (!resolvedLogin || !resolvedServer)) {
            const ownedAcc = await prisma.tradingAccount.findFirst({
                where: { id: accountId, userId: user.id },
                select: { accountNumber: true, server: true },
            });
            if (ownedAcc) {
                if (!resolvedLogin && ownedAcc.accountNumber) {
                    resolvedLogin = ownedAcc.accountNumber.trim();
                }
                if (!resolvedServer && ownedAcc.server) {
                    resolvedServer = ownedAcc.server.trim();
                }
            }
        }

        if (!resolvedLogin || !password?.trim() || !resolvedServer) {
            return NextResponse.json(
                { error: "Please enter MT5 Login, Password, and Broker Server." },
                { status: 400 }
            );
        }

        const result = await connectBridgeAccountForUser({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            login: resolvedLogin,
            password: password.trim(),
            server: resolvedServer,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to connect MT5 account." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            account: result.account,
            state: result.state,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Connect error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get("accountId");
        const removeCredential =
            searchParams.get("removeCredential") === "true";
        if (!accountId) {
            return NextResponse.json(
                { error: "Missing accountId" },
                { status: 400 }
            );
        }

        const owned = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { id: true },
        });
        if (!owned) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        await disconnectBridgeAccountById(owned.id, removeCredential);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Disconnect error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
