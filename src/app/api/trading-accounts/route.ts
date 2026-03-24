import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

// GET - List user's trading accounts
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const skip = (page - 1) * limit;

        const [accounts, total] = await Promise.all([
            prisma.tradingAccount.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    name: true,
                    color: true, // Custom color
                    platform: true,
                    broker: true,
                    accountNumber: true,
                    status: true,
                    lastHeartbeat: true,
                    lastSync: true,
                    totalTrades: true,
                    autoSync: true,
                    createdAt: true,
                    server: true,
                    balance: true,
                    equity: true,
                    accountType: true,
                    useForLeaderboard: true,
                    // Don't expose full API key
                    apiKey: false,
                },
                skip,
                take: limit,
            }),
            prisma.tradingAccount.count({ where: { userId: user.id } })
        ]);

        // Calculate connection status based on heartbeat
        const accountsWithStatus = accounts.map((acc) => ({
            ...acc,
            isConnected: acc.lastHeartbeat
                ? Date.now() - new Date(acc.lastHeartbeat).getTime() < 10 * 60 * 1000 // 10 min
                : false,
        }));

        return NextResponse.json({
            accounts: accountsWithStatus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Trading accounts list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch accounts" },
            { status: 500 }
        );
    }
}

// POST - Create new trading account
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, platform, broker, accountNumber, color } = body;

        // Validate platform
        const validPlatforms = ["MT4", "MT5", "CTRADER"];
        if (!validPlatforms.includes(platform)) {
            return NextResponse.json(
                { error: "Invalid platform" },
                { status: 400 }
            );
        }

        // Generate unique API key
        const apiKey = generateApiKey();

        const account = await prisma.tradingAccount.create({
            data: {
                userId: user.id,
                name: name || `${platform} Account`,
                // Default color if not provided
                color: color || "hsl(var(--primary))",
                platform,
                broker,
                accountNumber,
                apiKey,
            },
        });

        return NextResponse.json({
            success: true,
            account: {
                id: account.id,
                name: account.name,
                platform: account.platform,
                apiKey: account.apiKey, // Only show once on creation
            },
        });
    } catch (error) {
        console.error("Create trading account error:", error);
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        );
    }
}
