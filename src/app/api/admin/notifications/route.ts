import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";
import { AccountStatus } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                createErrorResponse(ErrorCode.UNAUTHORIZED),
                { status: 401 }
            );
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
            return NextResponse.json(createErrorResponse(ErrorCode.NOT_ADMIN), {
                status: 403,
            });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "5");

        const [
            pendingLicenses,
            recentRequests,
            pendingCopyTrading,
            recentCopyTrading,
            dbNotifications,
        ] = await Promise.all([
            prisma.eALicense.count({
                where: { status: AccountStatus.PENDING },
            }),
            prisma.eALicense.findMany({
                where: { status: AccountStatus.PENDING },
                orderBy: { createdAt: "desc" },
                take: limit,
                include: { user: { select: { email: true, name: true } } },
            }),
            prisma.copyTradingRegistration.count({
                where: { status: "PENDING" },
            }),
            prisma.copyTradingRegistration.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "desc" },
                take: limit,
                include: { user: { select: { email: true, name: true } } },
            }),
            // Fetch real notifications from Notification table for this admin
            prisma.notification.findMany({
                where: { userId: user.id, isRead: false },
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
        ]);

        const notifications = recentRequests.map((license) => ({
            id: license.id,
            type: "NEW_LICENSE_REQUEST",
            title: "New Request",
            message: `${license.user.email} - ${license.broker} ${license.accountNumber}`,
            link: NOTIFICATION_ROUTES.EA_PENDING_ADMIN,
            isRead: false,
            createdAt: license.createdAt.toISOString(),
        }));

        const copyTradingNotifications = recentCopyTrading.map((reg) => ({
            id: `ct-${reg.id}`,
            type: "NEW_COPY_TRADING_REQUEST" as const,
            title: "New Copy Trading",
            message: `${reg.user.name || reg.user.email} — ${reg.brokerName} ${reg.mt5AccountNumber}`,
            link: NOTIFICATION_ROUTES.COPY_TRADING_ADMIN,
            isRead: false,
            createdAt: reg.createdAt.toISOString(),
        }));

        // Map real DB notifications
        const realNotifications = dbNotifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link || NOTIFICATION_ROUTES.ADMIN_DASHBOARD,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
        }));

        const allNotifications = [
            ...notifications,
            ...copyTradingNotifications,
            ...realNotifications,
        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, limit);

        const unreadCount =
            pendingLicenses + pendingCopyTrading + dbNotifications.length;

        return NextResponse.json(
            createSuccessResponse({
                notifications: allNotifications,
                pendingLicenses,
                pendingCopyTrading,
                unreadCount,
            })
        );
    } catch (error) {
        console.error("GET Admin Notifications Error:", error);
        return NextResponse.json(
            createErrorResponse(ErrorCode.INTERNAL_ERROR),
            { status: 500 }
        );
    }
}
