import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    AccountStatus,
    NotificationType,
    NotificationPriority,
} from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { requireCronSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

        return NextResponse.json({ success: true, count: processedCount });
    } catch (error) {
        console.error("Cron Expire Licenses Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
