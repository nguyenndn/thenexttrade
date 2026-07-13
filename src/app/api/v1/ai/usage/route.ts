import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";

const PRO_LIMIT = 100;
const FREE_LIMIT = 10;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error_code: "INVALID_LICENSE", message: "Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    
    const user = await prisma.user.findUnique({
      where: { syncApiKey: token },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error_code: "INVALID_LICENSE", message: "License key is invalid or expired." }, { status: 401 });
    }

    const proAccess = await getUserProAccess(user.id);
    const dailyLimit = proAccess.isPro ? PRO_LIMIT : FREE_LIMIT;
    
    const startOfDay = new Date();
    startOfDay.setUTCHours(0,0,0,0);

    const usedToday = await prisma.analyticsEvent.count({
      where: {
        userId: user.id,
        name: "AI_ANALYZE",
        createdAt: { gte: startOfDay }
      }
    });

    return NextResponse.json({
      ok: true,
      plan: proAccess.isPro ? "pro" : "free",
      daily_limit: dailyLimit,
      used_today: usedToday,
      remaining_today: Math.max(0, dailyLimit - usedToday)
    });

  } catch (error) {
    return NextResponse.json({ ok: false, error_code: "SERVER_ERROR", message: "Internal server error" }, { status: 500 });
  }
}
