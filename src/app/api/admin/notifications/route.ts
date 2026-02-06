
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";
import { AccountStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED), { status: 401 });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
            return NextResponse.json(createErrorResponse(ErrorCode.NOT_ADMIN), { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "5");

        const [pendingLicenses, recentRequests] = await Promise.all([
            prisma.eALicense.count({ where: { status: AccountStatus.PENDING } }),
            prisma.eALicense.findMany({
                where: { status: AccountStatus.PENDING },
                orderBy: { createdAt: "desc" },
                take: limit,
                include: { user: { select: { email: true, name: true } } },
            }),
        ]);

        const notifications = recentRequests.map(license => ({
            id: license.id,
            type: "NEW_LICENSE_REQUEST",
            title: "New Request",
            message: `${license.user.email} - ${license.broker} ${license.accountNumber}`,
            link: "/admin/ea/accounts/pending",
            isRead: false,
            createdAt: license.createdAt.toISOString(),
        }));

        return NextResponse.json(createSuccessResponse({
            notifications,
            pendingLicenses,
            unreadCount: 0, // Set to 0 to avoid double counting in frontend (pendingLicenses + unreadNotifications)
        }));
    } catch (error) {
        console.error("GET Admin Notifications Error:", error);
        return NextResponse.json(createErrorResponse(ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
}
