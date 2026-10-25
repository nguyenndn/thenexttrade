import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";
import { loadAdminNotificationFeed } from "@/lib/admin/admin-notification-center.server";

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
        const feed = await loadAdminNotificationFeed({
            adminUserId: user.id,
            filter: searchParams.get("filter"),
            limit: searchParams.get("limit"),
            cursor: searchParams.get("cursor"),
        });

        return NextResponse.json(
            createSuccessResponse({
                notifications: feed.notifications,
                pendingLicenses: feed.pendingLicenses,
                pendingVipRequests: feed.pendingVipRequests,
                // Backward-compatible name: real unread notifications only.
                unreadDbCount: feed.unreadCount,
                unreadCount: feed.unreadCount,
                nextCursor: feed.nextCursor,
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
