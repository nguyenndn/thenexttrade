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

        if (profile?.role !== "ADMIN") {
            return NextResponse.json(createErrorResponse(ErrorCode.NOT_ADMIN), {
                status: 403,
            });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "5");

        const [
            pendingLicenses,
            recentRequests,
            pendingVipRequests,
            recentVipRequests,
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
            prisma.vipRequest.count({
                where: { status: "PENDING" },
            }),
            prisma.vipRequest.findMany({
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

        const licenseNotifications = recentRequests.map((license) => ({
            id: license.id,
            type: "NEW_LICENSE_REQUEST" as const,
            title: "New License Request",
            message: `${license.user.email} — ${license.broker} (${license.accountNumber})`,
            link: NOTIFICATION_ROUTES.EA_PENDING_ADMIN,
            isRead: false,
            createdAt: license.createdAt.toISOString(),
        }));

        const vipNotifications = recentVipRequests.map((vip) => ({
            id: vip.id,
            type: "NEW_VIP_REQUEST" as const,
            title: "👑 New VIP Request",
            message: `${vip.user?.name || vip.fullName || vip.user?.email || vip.email} — ${vip.broker} (${vip.accountNumber})`,
            link: `${NOTIFICATION_ROUTES.VIP_PIPELINE_ADMIN}?status=PENDING`,
            isRead: false,
            createdAt: vip.createdAt.toISOString(),
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
            ...vipNotifications,
            ...licenseNotifications,
            ...realNotifications,
        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, limit);

        const unreadCount =
            pendingLicenses + pendingVipRequests + dbNotifications.length;

        return NextResponse.json(
            createSuccessResponse({
                notifications: allNotifications,
                pendingLicenses,
                pendingVipRequests,
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
