import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { requireCronSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic"; // Ensure not cached

export async function GET(request: NextRequest) {
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const now = new Date();

        // Find pending broadcasts scheduled for now or past (sentAt is null = not yet sent)
        const pendingBroadcasts = await prisma.adminBroadcast.findMany({
            where: {
                sentAt: null,
                scheduledAt: { lte: now },
            },
        });

        if (pendingBroadcasts.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        let sentCount = 0;

        for (const broadcast of pendingBroadcasts) {
            // Logic from createBroadcast (Action) but batch processing
            const users = await prisma.user.findMany({ select: { id: true } });

            if (users.length > 0) {
                // Chunk inserts if too many users
                const batchSize = 1000;
                for (let i = 0; i < users.length; i += batchSize) {
                    const batch = users.slice(i, i + batchSize);
                    await prisma.notification.createMany({
                        data: batch.map((u) => ({
                            userId: u.id,
                            type: broadcast.type,
                            title: broadcast.title,
                            message: broadcast.message,
                            priority: broadcast.priority,
                            link:
                                broadcast.link || NOTIFICATION_ROUTES.DASHBOARD,
                            isRead: false,
                        })),
                    });
                }
            }

            await prisma.adminBroadcast.update({
                where: { id: broadcast.id },
                data: { sentAt: now },
            });

            sentCount++;
        }

        return NextResponse.json({ success: true, count: sentCount });
    } catch (error) {
        console.error("Cron Broadcast Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
