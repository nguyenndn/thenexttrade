import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserQuotaUsage } from "@/lib/ai-gateway/quota-service";
import { normalizeSyncApiKey } from "@/lib/utils/api-key";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "INVALID_LICENSE",
                    message: "Missing or invalid token",
                },
                { status: 401 }
            );
        }
        const rawToken = authHeader.slice("Bearer ".length).trim();
        const token = normalizeSyncApiKey(rawToken);
        let user = token
            ? await prisma.user.findUnique({
                  where: { syncApiKey: token },
                  select: { id: true },
              })
            : null;

        if (!user && rawToken && rawToken !== token) {
            user = await prisma.user.findUnique({
                where: { syncApiKey: rawToken },
                select: { id: true },
            });
        }
        if (!user) {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "INVALID_LICENSE",
                    message: "License key is invalid or expired.",
                },
                { status: 401 }
            );
        }

        const quota = await getUserQuotaUsage(user.id);
        return NextResponse.json({
            ok: true,
            plan: quota.isPro ? "pro" : "free",
            daily_limit: quota.dailyLimit,
            used_today: quota.usedToday,
            remaining_today: quota.remainingToday,
        });
    } catch {
        return NextResponse.json(
            {
                ok: false,
                error_code: "SERVER_ERROR",
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}
