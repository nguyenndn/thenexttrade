import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    AccountStatus,
    NotificationType,
    NotificationPriority,
} from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { requireCronSecret } from "@/lib/api-auth";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const today = new Date();

        // Find expired licenses that are still ACTIVE (Approved)
        const expiredLicenses = await prisma.eALicense.findMany({
            where: {
                status: AccountStatus.APPROVED,
                expiryDate: { lt: today }, // Expiry date is in the past
            },
        });

        if (expiredLicenses.length === 0) {
            await recordCronRun("expire-licenses", cronStartedAt, "SUCCESS");
            return NextResponse.json({ success: true, count: 0 });
        }

        let processedCount = 0;

        for (const license of expiredLicenses) {
            await prisma.eALicense.update({
                where: { id: license.id },
                data: { status: AccountStatus.EXPIRED },
            });

            // Notify User
            await prisma.notification.create({
                data: {
                    userId: license.userId,
                    type: NotificationType.LICENSE_EXPIRED,
                    title: "License Expired",
                    message: `Your license for account ${license.accountNumber} has expired. Please renew to continue downloading EAs.`,
                    priority: NotificationPriority.HIGH,
                    link: NOTIFICATION_ROUTES.EA_DASHBOARD,
                },
            });

            processedCount++;
        }

        await recordCronRun("expire-licenses", cronStartedAt, "SUCCESS");
        return NextResponse.json({ success: true, count: processedCount });
    } catch (error) {
        console.error("Cron Expire Licenses Error:", error);
        await recordCronRun("expire-licenses", cronStartedAt, "FAILED", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
