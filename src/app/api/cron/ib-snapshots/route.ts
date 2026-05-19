import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { generateActivitySnapshots } from "@/lib/services/ib-snapshot.service";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Cron: Generate IB Activity Snapshots
 * Schedule: Daily at 01:00 UTC
 * Security: Protected by CRON_SECRET
 */
export async function GET(request: Request) {
  const cronAuth = requireCronSecret(request);
  if (cronAuth instanceof NextResponse) return cronAuth;

  try {
    const result = await generateActivitySnapshots();

    // Send notifications for at-risk/dormant users
    let notificationsSent = 0;

    if (result.atRisk > 0 || result.dormant > 0) {
      // Fetch at-risk users who haven't been notified recently
      const atRiskSnapshots = await prisma.ibActivitySnapshot.findMany({
        where: {
          activityStatus: { in: ["AT_RISK", "DORMANT"] },
          periodEnd: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: { userId: true, activityStatus: true },
      });

      for (const snap of atRiskSnapshots) {
        // Check if we already sent a nudge in last 7 days
        const recentNotif = await prisma.notification.findFirst({
          where: {
            userId: snap.userId,
            type: "NO_TRADES_NUDGE",
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentNotif) {
          await prisma.notification.create({
            data: {
              userId: snap.userId,
              type: "NO_TRADES_NUDGE",
              title: snap.activityStatus === "DORMANT"
                ? "📊 We miss you! No trades for 30+ days"
                : "📊 Heads up — No trades for 14+ days",
              message: snap.activityStatus === "DORMANT"
                ? "It's been over a month since your last trade. Jump back in and keep improving!"
                : "You haven't placed any trades recently. Consistency is key to growth. Consider reviewing your strategy.",
              priority: "LOW",
              link: NOTIFICATION_ROUTES.JOURNAL,
            },
          });
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[IB Snapshot Cron Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate snapshots", detail: error.message },
      { status: 500 }
    );
  }
}

// PRO-QA-008: Support POST as well (some cron systems use POST)
export { GET as POST };
